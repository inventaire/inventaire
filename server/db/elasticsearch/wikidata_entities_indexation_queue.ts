import { getAggregatedWdEntityLayers } from '#controllers/entities/lib/get_wikidata_enriched_entities'
import { waitForElasticsearchInit } from '#db/elasticsearch/init'
import { initJobQueue } from '#db/level/jobs'
import { isWdEntityId } from '#lib/boolean_validations'
import { elasticReqOptions, getIndexedDocUrl } from '#lib/elasticsearch'
import { newError } from '#lib/error/error'
import { waitForCPUsLoadToBeBelow } from '#lib/os'
import { wait } from '#lib/promises'
import { requests_ } from '#lib/requests'
import { assertNumber } from '#lib/utils/assert_types'
import { info, logError, warn } from '#lib/utils/logs'
import config, { federatedMode } from '#server/config'
import type { WdEntityId } from '#types/entity'

const { env, nice } = config
if (env.startsWith('tests') && nice) {
  // Comment-out to test niceness in tests environment
  throw new Error('config.nice should be false in tests env, as otherwise it makes tests fails')
}

const { minReindexationInterval } = config.elasticsearch
assertNumber(minReindexationInterval)

const indexName = 'wikidata'

let reindexWdEntity
async function importCircularDependencies () {
  const { indexation } = await import('#db/elasticsearch/indexation')
  reindexWdEntity = indexation(indexName)
}
setImmediate(importCircularDependencies)

async function entitiesIndexationWorker (jobId, wdId: WdEntityId) {
  await waitForElasticsearchInit()
  if (!reindexWdEntity) {
    warn('entitiesIndexationWorker: waiting for reindexWdEntity function to be available')
    await wait(1000)
    return entitiesIndexationWorker(jobId, wdId)
  }
  try {
    info(`wd entity indexation worker pending: ${wdId}`)
    // Run the worker when the CPUs activity is below 50% load
    // to give the priority to more urgent matters,
    // such as answering users requests
    if (nice) await waitForCPUsLoadToBeBelow({ threshold: 0.5 })
    info(`wd entity indexation worker running: ${wdId}`)
    const entity = await getAggregatedWdEntityLayers({ wdId, dry: true })
    if (entity) {
      const indexedEntity = await getIndexedEntity(wdId)
      const indexationTime = indexedEntity?._indexationTime
      const entityWasRecentlyIndexed = indexationTime && ((Date.now() - indexationTime) < minReindexationInterval)
      if (entityWasRecentlyIndexed && noObviousChange(indexedEntity, entity)) {
        info(`wd entity indexation worker skipped (too recently reindexed): ${wdId}`)
      } else {
        entity._indexationTime = Date.now()
        entity._id = wdId
        await reindexWdEntity(entity)
        info(`wd entity indexation worker done: ${wdId}`)
      }
    } else {
      warn(`wd entity not found in cache: ${wdId}`)
    }
  } catch (err) {
    logError(err, 'entitiesIndexationWorker err')
    throw err
  }
}

async function getIndexedEntity (wdId: WdEntityId) {
  const url = getIndexedDocUrl(indexName, wdId)
  try {
    const { _source } = await requests_.get(url, elasticReqOptions)
    return _source
  } catch (err) {
    if (err.statusCode !== 404) throw err
  }
}

function noObviousChange (indexedEntity, entity) {
  if (indexedEntity.lastrevid !== entity.lastrevid) return false
  if (indexedEntity.type !== entity.type) return false
  if (indexedEntity.invRev !== entity.invRev) return false
  return true
}

let wdEntitiesIndexationJobQueue
if (!federatedMode) {
  wdEntitiesIndexationJobQueue = initJobQueue('wd:entity:indexation', entitiesIndexationWorker, 1)
}

export function addWdEntityToIndexationQueue (wdId: WdEntityId) {
  if (isWdEntityId(wdId)) {
    wdEntitiesIndexationJobQueue.push(wdId)
  } else {
    // Tracking down why some isbns arrive here as wd id
    logError(newError('invalid wd entity id', 500, { wdId }), 'addWdEntityToIndexationQueue err')
  }
}

export const getWikidataIndexationQueueLength = wdEntitiesIndexationJobQueue?.getQueueLength
export const clearWikidataIndexationQueue = wdEntitiesIndexationJobQueue?.clearQueue
