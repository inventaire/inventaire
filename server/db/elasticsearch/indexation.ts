import { throttle } from 'lodash-es'
import { getFirstClaimValue } from '#controllers/entities/lib/inv_claims_utils'
import { unprefixify } from '#controllers/entities/lib/prefix'
import { addWdEntityToIndexationQueue } from '#db/elasticsearch/wikidata_entities_indexation_queue'
import { assert_ } from '#lib/utils/assert_types'
import { isLocalEntityLayer } from '#models/entity'
import config from '#server/config'
import type { SerializedWdEntity, WdEntityId } from '#types/entity'
import { addToBatch, postBatch } from './bulk.js'
import deindex from './deindex.js'
import filters from './filters.js'
import formatters from './formatters/formatters.js'
import { indexesNamesByBaseNames, type IndexBaseName, type IndexedCouchDoc } from './indexes.js'

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

  return async function (doc: IndexedCouchDoc | SerializedWdEntity) {
    if (!filter(doc)) return
    if (shouldBeDeindexed(doc)) {
      addToBatch(batch, 'delete', index, doc)
    } else if ('type' in doc && doc.type === 'entity' && 'claims' in doc && isLocalEntityLayer(doc)) {
      const remoteEntityUri = getFirstClaimValue(doc.claims, 'invp:P1')
      const remoteEntityId = unprefixify(remoteEntityUri) as WdEntityId
      addWdEntityToIndexationQueue(remoteEntityId)
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
