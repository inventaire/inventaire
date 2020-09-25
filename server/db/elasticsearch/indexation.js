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

const shouldBeDeindexed = (indexBaseName, doc) => {
  if (indexBaseName === 'users') {
    return doc.type === 'deletedUser'
  } else if (indexBaseName === 'entities') {
    return doc.type === 'removed:placeholder' || doc.redirect != null
  } else {
    return doc._deleted === true
  }
}

module.exports = async (indexBaseName, index, doc) => {
  if (shouldBeDeindexed(indexBaseName, doc)) {
    addToNextBatch('delete', index, doc)
  } else {
    const formattedDoc = await formatters[indexBaseName](doc)
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
