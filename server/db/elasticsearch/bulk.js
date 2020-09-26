const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const requests_ = __.require('lib', 'requests')
const { host: elasticHost, updateDelay } = CONFIG.elasticsearch
const { logBulkRes } = require('./helpers')
const bulkThrottleDelay = updateDelay / 2
const assert_ = __.require('utils', 'assert_types')
const headers = { 'content-type': 'application/json' }

let batch = []
const addToNextBatch = (action, index, doc) => {
  const { _id } = doc
  assert_.string(_id)
  // Prevent triggering the error
  // 'Field [_id] is a metadata field and cannot be added inside a document.'
  delete doc._id
  batch.push(`{"${action}":{"_index":"${index}","_id":"${_id}"}}`)
  if (action === 'index') batch.push(JSON.stringify(doc))
  if (batch.length >= 1000) postBatch()
  else lazyPostBatch()
}

const postBatch = async () => {
  // It is required to end by a newline break
  const body = batch.join('\n') + '\n'
  // Reset
  batch = []
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

const lazyPostBatch = _.throttle(postBatch, bulkThrottleDelay, { leading: false })

module.exports = { addToNextBatch }
