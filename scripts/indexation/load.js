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
  if (line === '') return
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
  received++
  const doc = parseLine(line)
  if (doc == null || !filter(doc) || shouldBeDeindexed(doc)) return
  const formattedDoc = await format(doc)
  addToBatch(batch, 'index', index, formattedDoc)
  indexed++
  if (batch.length >= 4000) await post()
}

// Ensure index creation to load mappings and settings
createIndex(index)

process.stdin
.pipe(split())
.on('data', async function (line) {
  this.pause()
  await addLine(line)
  this.resume()
})
.on('close', async () => {
  _.info(`${indexBaseName} indexation:load stdin closed`)
  await post()
  _.success(`${indexBaseName} indexation:load done`)
})
.on('error', _.Error(`${indexBaseName} indexation:load err`))

setInterval(() => {
  _.info({ received, indexed }, 'indexation:load status')
}, 5000)
