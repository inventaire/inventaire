#!/usr/bin/env node
const CONFIG = require('config')
const __ = CONFIG.universalPath
const { indexesList, indexes } = __.require('db', 'elasticsearch/list')
const { logErrorAndExit } = require('../scripts_utils')
const split = require('split2')
const { red } = require('chalk')
const formatters = __.require('db', 'elasticsearch/formatters/formatters')
const filters = __.require('db', 'elasticsearch/filters')
const deindex = __.require('db', 'elasticsearch/deindex')
const createIndex = __.require('db', 'elasticsearch/create_index')
const [ indexBaseName ] = process.argv.slice(2)
const { addToBatch } = __.require('db', 'elasticsearch/bulk')
const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: 'http://localhost:9200' })
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

const addLine = async line => {
  const doc = parseLine(line)
  if (doc == null) return
  if (!filter(doc) || shouldBeDeindexed(doc)) return
  const formattedDoc = await format(doc)
  if (formattedDoc) {
    return addToBatch('index', index, formattedDoc)
  }
}

const readStream = () => process.stdin.pipe(split(addLine))

// Ensure index creation to load mappings and settings
createIndex(index)
// before starting to load
.then(() => {
  client.helpers.bulk({
    datasource: readStream(),
    onDocument: () => {
      return { index: { _index: index } }
    }
  })
})
