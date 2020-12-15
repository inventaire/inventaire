#!/usr/bin/env node
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { indexesList, indexes } = __.require('db', 'elasticsearch/list')
const { logErrorAndExit } = require('../scripts_utils')
const split = require('split')
const { red } = require('chalk')
const formatters = __.require('db', 'elasticsearch/formatters/formatters')
const filters = __.require('db', 'elasticsearch/filters')
const deindex = __.require('db', 'elasticsearch/deindex')
const { addToBatch, postBatch } = __.require('db', 'elasticsearch/bulk')
const createIndex = __.require('db', 'elasticsearch/create_index')
const [ indexBaseName ] = process.argv.slice(2)

if (!indexesList.includes(indexBaseName)) {
  logErrorAndExit(`invalid index base name: ${indexBaseName} (valid indexes: ${indexesList.join(', ')})`)
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

let batch = []
const post = async () => {
  await postBatch(batch)
  batch = []
}

let received = 0
let indexed = 0

const addLine = async line => {
  const doc = parseLine(line)
  if (doc == null) return
  received++
  if (!filter(doc) || shouldBeDeindexed(doc)) return
  const formattedDoc = await format(doc, { quick: true })
  if (formattedDoc) {
    addToBatch(batch, 'index', index, formattedDoc)
    indexed++
  }
  if (batch.length >= 4000) await post()
}

const logStatusPeriodically = () => _.info({ received, indexed }, 'indexation:load status')
const statusLogInterval = setInterval(logStatusPeriodically, 5000)
const lastStatusLog = () => {
  clearInterval(statusLogInterval)
  logStatusPeriodically()
}

const stopLoading = logErrorAndExit.bind(null, 'loadFromStdin')

const loadFromStdin = () => {
  process.stdin
  .pipe(split())
  .on('data', async function (line) {
    this.pause()
    await addLine(line).catch(stopLoading)
    this.resume()
  })
  .on('close', async () => {
    _.info(`${indexBaseName} indexation:load stdin closed`)
    await post().catch(stopLoading)
    _.success(`${indexBaseName} indexation:load done`)
    lastStatusLog()
  })
  .on('error', _.Error(`${indexBaseName} indexation:load err`))
}

// Ensure index creation to load mappings and settings
createIndex(index)
// before starting to load
.then(loadFromStdin)
.catch(console.error)
