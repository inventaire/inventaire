#!/usr/bin/env node
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { indexesList, indexes } = __.require('db', 'elasticsearch/list')
const indexation = __.require('db', 'elasticsearch/indexation')
const { logErrorAndExit } = require('../scripts_utils')
const split = require('split')
const { red } = require('chalk')

const [ indexBaseName ] = process.argv.slice(2)

if (!indexesList.includes(indexBaseName)) {
  logErrorAndExit(`invalid index base name: ${indexBaseName} (valid indexes: ${indexesList.join(', ')})`)
}

const { index: indexName } = indexes[indexBaseName]

const indexFn = indexation(indexBaseName, indexName)

const indexLineDoc = line => {
  if (line === '') return
  let doc
  try {
    doc = JSON.parse(line)
  } catch (err) {
    console.error(red('fail to parse line:'), line)
    return
  }
  indexFn(doc)
}

process.stdin
.pipe(split())
.on('data', indexLineDoc)
.on('close', () => _.info('indexation:load stdin closed'))
.on('error', _.Error('indexation:load err'))
