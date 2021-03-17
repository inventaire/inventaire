#!/usr/bin/env node
require('module-alias/register')
const _ = require('builders/utils')
const { indexes } = require('db/elasticsearch/list')
const { logErrorAndExit } = require('../scripts_utils')
const split = require('split')
const { red } = require('chalk')
const formatters = require('db/elasticsearch/formatters/formatters')
const filters = require('db/elasticsearch/filters')
const deindex = require('db/elasticsearch/deindex')
const { addToBatch, postBatch } = require('db/elasticsearch/bulk')
const createIndex = require('db/elasticsearch/create_index')
const { wait } = require('lib/promises')
const [ indexBaseName ] = process.argv.slice(2)
const indexBaseNames = Object.keys(indexes)

if (!indexBaseNames.includes(indexBaseName)) {
  logErrorAndExit(`invalid index base name: ${indexBaseName} (valid indexes: ${indexBaseNames.join(', ')})`)
}

const { index } = indexes[indexBaseName]

const format = formatters[indexBaseName]
const shouldBeDeindexed = deindex[indexBaseName]
const filter = filters[indexBaseName]

const parseLine = line => {
  if (line == null || line === '') return
  try {
    return JSON.parse(line)
  } catch (err) {
    console.error(red('fail to parse line:'), line)
  }
}

let received = 0
let queued = 0
let indexed = 0
let dropped = 0
let batch = []

const post = async () => {
  const batchReadyToPost = batch
  batch = []
  await postBatch(batchReadyToPost)
  indexed += queued
  queued = 0
}

const addLine = async line => {
  const doc = parseLine(line)
  if (doc == null) return
  received++
  if (!filter(doc) || shouldBeDeindexed(doc)) return
  const formattedDoc = await format(doc, { quick: true })
  if (formattedDoc) {
    addToBatch(batch, 'index', index, formattedDoc)
    queued++
  } else {
    dropped++
  }
  if (batch.length >= 4000) await post()
}

const logStatusPeriodically = () => _.info({ received, queued, indexed, dropped }, 'indexation:load status')
const statusLogInterval = setInterval(logStatusPeriodically, 5000)
const lastStatusLog = () => {
  clearInterval(statusLogInterval)
  logStatusPeriodically()
}

const stopLoading = logErrorAndExit.bind(null, 'loadFromStdin')

let ongoing = 0
const loadFromStdin = () => {
  process.stdin
  .pipe(split())
  .on('data', async function (line) {
    ongoing++
    if (ongoing >= 3) this.pause()
    await addLine(line).catch(stopLoading)
    if (ongoing < 3 && this.paused) this.resume()
    ongoing--
  })
  .on('close', async () => {
    _.info(`${indexBaseName} indexation:load stdin closed`)
    await waitForAllOngoingLines()
    await post().catch(stopLoading)
    _.success(`${indexBaseName} indexation:load done`)
    lastStatusLog()
  })
  .on('error', _.Error(`${indexBaseName} indexation:load err`))
}

const waitForAllOngoingLines = async () => {
  if (ongoing === 0) return
  _.warn(`waiting for ${ongoing} lines`)
  await wait(1000)
  return waitForAllOngoingLines()
}

// Ensure index creation to load mappings and settings
createIndex(index)
// before starting to load
.then(loadFromStdin)
.catch(err => logErrorAndExit('indexation/load.js crashed', err))
