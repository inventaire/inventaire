import CONFIG from 'config'
import _ from '#builders/utils'
import assert_ from '#lib/utils/assert_types'
import formatters from './formatters/formatters.js'
import filters from './filters.js'
import deindex from './deindex.js'
import { addToBatch, postBatch } from './bulk.js'
import { indexesNamesByBaseNames } from './indexes.js'

const { updateDelay } = CONFIG.elasticsearch
const bulkThrottleDelay = updateDelay / 2

let batch = []

export default indexBaseName => {
  assert_.string(indexBaseName)
  const index = indexesNamesByBaseNames[indexBaseName]
  const format = formatters[indexBaseName]
  const shouldBeDeindexed = deindex[indexBaseName]
  const filter = filters[indexBaseName]

  assert_.function(format)
  assert_.function(shouldBeDeindexed)
  assert_.function(filter)

  return async doc => {
    if (!filter(doc)) return
    if (shouldBeDeindexed(doc)) {
      addToBatch(batch, 'delete', index, doc)
    } else {
      // Allow the format function to return undefined,
      // to be used as a filter for cases that couldn't be filtered-out
      // by the filter function above
      const formattedDoc = await format(doc)
      if (formattedDoc) addToBatch(batch, 'index', index, formattedDoc)
    }
    if (batch.length >= 1000) postAndReset(batch)
    // Known case where batch.length would still be 0: docs that won't generate
    // a formattedDoc and thus not be indexed such as edition entities
    else if (batch.length > 0) lazyPostAndReset()
  }
}

const postAndReset = () => {
  postBatch(batch)
  batch = []
}

const lazyPostAndReset = _.throttle(postAndReset, bulkThrottleDelay, { leading: false })
