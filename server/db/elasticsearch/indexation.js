const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const requests_ = __.require('lib', 'requests')
const { host: elasticHost } = CONFIG.elasticsearch
const { logRes } = __.require('controllers', 'entities/lib/indexation/bulk')

const formatters = {
  items: require('./formatters/item'),
  groups: require('./formatters/group'),
  users: require('./formatters/user'),
  entities: _.identity,
}

module.exports = async (indexBaseName, index, doc) => {
  const formattedDoc = await formatters[indexBaseName](doc)
  if (formattedDoc._deleted) {
    addToNextBatch('delete', index, formattedDoc)
  } else {
    addToNextBatch('index', index, formattedDoc)
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
  .then(logRes('bulk post res'))
  .catch(_.Error('bulk post err'))
}
