const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const formatters = require('./formatters/formatters')
const filters = require('./filters')
const deindex = require('./deindex')
const { addToBatch, postBatch } = require('./bulk')
const { updateDelay } = CONFIG.elasticsearch
const bulkThrottleDelay = updateDelay / 2

let batch = []

module.exports = ({ indexBaseName, index, startFromEmptyIndex = false }) => {
  index = index || indexBaseName
  const format = formatters[indexBaseName]
  const shouldBeDeindexed = deindex[indexBaseName]
  const filter = filters[indexBaseName]
  return async doc => {
    if (!filter(doc)) return
    if (shouldBeDeindexed(doc)) {
      // There is nothing to deindex when starting from an empty index
      if (!startFromEmptyIndex) addToBatch(batch, 'delete', index, doc)
    } else {
      const formattedDoc = await format(doc)
      addToBatch(batch, 'index', index, formattedDoc)
    }
    if (batch.length >= 1000) postAndReset(batch)
    else lazyPostAndReset()
  }
}

const postAndReset = () => {
  postBatch(batch)
  batch = []
}

const lazyPostAndReset = _.throttle(postAndReset, bulkThrottleDelay, { leading: false })
