#!/usr/bin/env tsx
import split from 'split'
import { red } from 'tiny-chalk'
import { addToBatch, postBatch } from '#db/elasticsearch/bulk'
import createIndex from '#db/elasticsearch/create_index'
import deindex from '#db/elasticsearch/deindex'
import filters from '#db/elasticsearch/filters'
import formatters from '#db/elasticsearch/formatters/formatters'
import { indexes } from '#db/elasticsearch/indexes'
import { wait } from '#lib/promises'
import { warn, success, info, logError, LogError } from '#lib/utils/logs'
import { logErrorAndExit, logErrorMessageAndExit } from '../scripts_utils.js'

const [ indexBaseName ] = process.argv.slice(2)
const indexBaseNames = Object.keys(indexes)

if (!indexBaseNames.includes(indexBaseName)) {
  logErrorMessageAndExit(`invalid index base name: ${indexBaseName} (valid indexes: ${indexBaseNames.join(', ')})`)
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
    if (err.name !== 'SyntaxError') throw err
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

const logStatusPeriodically = () => info({ received, queued, indexed, dropped }, 'indexation:load status')
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
    // @ts-expect-error TS2683
    if (ongoing >= 3) this.pause()
    await addLine(line)
      .catch(err => {
        err.context ??= {}
        err.context.line = line
        logError(err, 'loadFromStdin addLine error')
      })
    // @ts-expect-error TS2683
    if (ongoing < 3 && this.paused) this.resume()
    ongoing--
  })
  .on('close', async () => {
    info(`${indexBaseName} indexation:load stdin closed`)
    await waitForAllOngoingLines()
    await post().catch(stopLoading)
    success(`${indexBaseName} indexation:load done`)
    lastStatusLog()
  })
  .on('error', LogError(`${indexBaseName} indexation:load err`))
}

const waitForAllOngoingLines = async () => {
  if (ongoing === 0) return
  warn(`waiting for ${ongoing} lines`)
  await wait(1000)
  return waitForAllOngoingLines()
}

// Ensure index creation to load mappings and settings
createIndex(index)
// before starting to load
.then(loadFromStdin)
.catch(err => logErrorAndExit('indexation/load.js crashed', err))
