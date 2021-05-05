const _ = require('builders/utils')
const requests_ = require('lib/requests')
const { host: elasticHost } = require('config').elasticsearch
const { logBulkRes } = require('./helpers')
const assert_ = require('lib/utils/assert_types')
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
  if (batch.length === 0) return _.warn('elasticsearch bulk update: empty batch')
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
