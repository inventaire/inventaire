#!/usr/bin/env node

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const requests_ = __.require('lib', 'requests')
const { host } = CONFIG.elasticsearch
const { indexesList } = __.require('db', 'elasticsearch/list')
const createIndex = require('./create_index')

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
