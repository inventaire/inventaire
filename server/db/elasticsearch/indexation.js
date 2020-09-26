const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const requests_ = __.require('lib', 'requests')
const { host: elasticHost } = CONFIG.elasticsearch
const formatters = require('./formatters/formatters')
const deindex = require('./deindex')
const { logBulkRes } = require('./helpers')

module.exports = (indexBaseName, index) => {
  index = index || indexBaseName
  const format = formatters[indexBaseName]
  const shouldBeDeindexed = deindex[indexBaseName]
  return async doc => {
    if (shouldBeDeindexed(doc)) {
      addToNextBatch('delete', index, doc)
    } else {
      const formattedDoc = await format(doc)
      addToNextBatch('index', index, formattedDoc)
    }
  }
}

let batch = []
const addToNextBatch = (action, index, doc) => {
  const { _id } = doc
  // Prevent triggering the error
  // 'Field [_id] is a metadata field and cannot be added inside a document.'
  delete doc._id
  batch.push(`{"${action}":{"_index":"${index}","_id":"${_id}"}}`)
  if (action === 'index') batch.push(JSON.stringify(doc))
  postBatch()
}

const postBatch = () => {
  // It is required to end by a newline break
  const body = batch.join('\n') + '\n'
  // Reset
  batch = []
  requests_.post(`${elasticHost}/_doc/_bulk`, {
    headers: { 'content-type': 'application/json' },
    body
  })
  .then(logBulkRes('bulk post res'))
  .catch(_.Error('bulk post err'))
}
