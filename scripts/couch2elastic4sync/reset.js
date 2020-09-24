#!/usr/bin/env node
const CONFIG = require('config')
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const requests_ = __.require('lib', 'requests')
const { host } = CONFIG.elasticsearch
const { indexesList } = __.require('db', 'elasticsearch/list')
const createIndex = __.require('db', 'elasticsearch/create_index')

const reset = dbName => {
  const url = `${host}/${dbName}`
  return requests_.delete(url)
  .then(_.Log(`delete ${url}`))
  .catch(ignoreMissing(url))
  .then(createIndex.bind(null, dbName))
  .catch(_.Error('reset'))
}

const ignoreMissing = url => err => {
  if (err.statusCode === 404) {
    return _.warn(url, 'no database to delete')
  } else {
    throw err
  }
}

indexesList.forEach(reset)
