#!/usr/bin/env node
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')

const { exec } = require('child_process')
const callOneByOne = require('./lib/call_one_by_one')
const wdCommand = './node_modules/.bin/wd'
const sparqlFolder = './scripts/entities_indexation/queries/sparql'
const resultsFolder = './scripts/entities_indexation/queries/results'
const types = require('./lib/types_parser')(sparqlFolder, 'rq')
const fs = require('fs')

const filePath = type => `./queries/results/${type}.json`

const archive = type => {
  const file = filePath(type)
  try {
    const { mtime } = fs.statSync(file)
    const timestamp = mtime.toISOString().replace(':', '-').split(':')[0]
    const renamed = file.replace('.json', `.${timestamp}.json`)
    return `mv ${file} ${renamed}`
  } catch (err) {
    if (err.code === 'ENOENT') return "echo 'no file to archive'"
    else throw err
  }
}

const update = type => `${wdCommand} sparql ${sparqlFolder}/${type}.rq --json > ${resultsFolder}/${type}.json`

const makeQuery = type => new Promise((resolve, reject) => {
  const updateCmd = `${update(type)}`
  _.info(updateCmd, 'running')
  const cmd = `${archive(type)} ; ${updateCmd}`
  return exec(cmd, (err, res) => {
    if (err) return reject(err)
    else return resolve(res)
  })
})

callOneByOne(types, 'query update', makeQuery)
.then(() => _.success(types, 'query updates done'))
.catch(_.ErrorRethrow(`query updates err (type: ${types})`))
