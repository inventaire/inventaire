import { throttle } from 'lodash-es'
import { assert_ } from '#lib/utils/assert_types'
import config from '#server/config'
import type { CouchDoc } from '#types/couchdb'
import type { SerializedWdEntity } from '#types/entity'
import { addToBatch, postBatch } from './bulk.js'
import deindex from './deindex.js'
import filters from './filters.js'
import formatters from './formatters/formatters.js'
import { indexesNamesByBaseNames, type IndexBaseName } from './indexes.js'

const { updateDelay } = config.elasticsearch
const bulkThrottleDelay = updateDelay / 2

let batch = []

export function indexation (indexBaseName: IndexBaseName) {
  assert_.string(indexBaseName)
  const index = indexesNamesByBaseNames[indexBaseName]
  const format = formatters[indexBaseName]
  const shouldBeDeindexed = deindex[indexBaseName]
  const filter = filters[indexBaseName]

  assert_.function(format)
  assert_.function(shouldBeDeindexed)
  assert_.function(filter)

  return async function (doc: CouchDoc | SerializedWdEntity) {
    if (!filter(doc)) return
    if (shouldBeDeindexed(doc)) {
      addToBatch(batch, 'delete', index, doc)
    } else {
      // Allow the format function to return undefined,
      // to be used as a filter for cases that couldn't be filtered-out
      // by the filter function above
      const formattedDoc = await format(doc)
      if (formattedDoc) {
        addToBatch(batch, 'index', index, formattedDoc)
      } else {
        addToBatch(batch, 'delete', index, doc)
      }
    }
    if (batch.length >= 1000) postAndReset()
    // Known case where batch.length would still be 0: docs that won't generate
    // a formattedDoc and thus not be indexed such as edition entities
    else if (batch.length > 0) lazyPostAndReset()
  }
}

function postAndReset () {
  postBatch(batch)
  batch = []
}

const lazyPostAndReset = throttle(postAndReset, bulkThrottleDelay, { leading: false })
