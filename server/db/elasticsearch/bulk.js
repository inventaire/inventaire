const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const requests_ = __.require('lib', 'requests')
const { host: elasticHost } = CONFIG.elasticsearch
const { logBulkRes } = require('./helpers')
const assert_ = __.require('utils', 'assert_types')
const headers = { 'content-type': 'application/x-ndjson' }

const addToBatch = (batch, action, index, doc) => {
  if (!doc) return _.warn('ignore empty doc')
  const { _id } = doc
  assert_.string(_id)
  // Prevent triggering the error
  // 'Field [_id] is a metadata field and cannot be added inside a document.'
  delete doc._id
  batch.push(`{"${action}":{"_index":"${index}","_id":"${_id}"}}`)
  if (action === 'index') batch.push(JSON.stringify(doc))
}

const postBatch = async batch => {
  if (batch.length === 0) return _.warn('empty batch')
  // It is required to end by a newline break
  const body = batch.join('\n') + '\n'
  try {
    const res = await requests_.post(`${elasticHost}/_doc/_bulk`, {
      headers,
      body
    })
    logBulkRes(res, 'bulk post res')
  } catch (err) {
    _.error(err, 'bulk post err')
  }
}

module.exports = { addToBatch, postBatch }
