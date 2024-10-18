// A request regrouper to query entities full data one by one
// while requests are actually regrouped in the background
import { chunk, uniq, without } from 'lodash-es'
import wdk from 'wikibase-sdk/wikidata.org'
import { newError } from '#lib/error/error'
import { requestGrouper } from '#lib/request_grouper'
import { requests_ } from '#lib/requests'
import { warn } from '#lib/utils/logs'
import type { WdEntityId } from '#server/types/entity'
import type { AbsoluteUrl } from '#types/common'
import type { Item as RawWdEntity } from 'wikibase-sdk'

const { getEntities } = wdk

async function requester (ids: WdEntityId[]) {
  ids = uniq(ids)
  const idsBatches = chunk(ids, 50)
  const entitiesBatches = {}
  for (const idsBatch of idsBatches) {
    const entitiesBatch = await getEntitiesBatch(idsBatch)
    Object.assign(entitiesBatches, entitiesBatch)
  }
  return entitiesBatches
}

async function getEntitiesBatch (idsBatch: WdEntityId[]) {
  const url = getEntities({ ids: idsBatch }) as AbsoluteUrl
  const { entities, error } = await requests_.get(url)
  if (entities) {
    return entities
  } else if (error?.id && idsBatch.includes(error.id)) {
    const idsBatchWithoutErronousId = without(idsBatch, error.id)
    warn(error, `error getting wikidata entity ${error.id}`)
    if (idsBatchWithoutErronousId.length > 0) {
      return getEntitiesBatch(idsBatchWithoutErronousId)
    } else {
      return {}
    }
  } else {
    throw newError('error getting wikidata entities', 500, { idsBatch, error })
  }
}

// Expose a single requester
// Taking a Wikidata Id
// Returning the corresponding entity object
export const getWdEntity = requestGrouper<WdEntityId, RawWdEntity>({ requester, delay: 500 })
