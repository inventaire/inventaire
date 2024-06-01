import { getAggregatedWdEntityLayers } from '#controllers/entities/lib/get_wikidata_enriched_entities'
import { waitForElasticsearchInit } from '#db/elasticsearch/init'
import { initJobQueue } from '#db/level/jobs'
import { getIndexedDocUrl } from '#lib/elasticsearch'
import { waitForCPUsLoadToBeBelow } from '#lib/os'
import { wait } from '#lib/promises'
import { requests_ } from '#lib/requests'
import { assert_ } from '#lib/utils/assert_types'
import { info, logError, warn } from '#lib/utils/logs'
import config from '#server/config'

const { nice } = config
const { minReindexationInterval } = config.elasticsearch
assert_.number(minReindexationInterval)

const indexName = 'wikidata'

let reindexWdEntity
async function importCircularDependencies () {
  const { indexation } = await import('#db/elasticsearch/indexation')
  reindexWdEntity = indexation(indexName)
}
setImmediate(importCircularDependencies)

async function entitiesIndexationWorker (jobId, wdId) {
  await waitForElasticsearchInit()
  if (!reindexWdEntity) {
    warn('entitiesIndexationWorker: waiting for reindexWdEntity function to be available')
    await wait(1000)
    return entitiesIndexationWorker(jobId, wdId)
  }
  try {
    info(`wd entity indexation worker pending: ${wdId}`)
    // Run the worker when the CPUs activity is below 55% load
    // to give the priority to more urgent matters,
    // such as answering users requests
    if (nice) await waitForCPUsLoadToBeBelow({ threshold: 0.5 })
    info(`wd entity indexation worker running: ${wdId}`)
    const formattedEntity = await getAggregatedWdEntityLayers({ wdId, dry: true })
    if (formattedEntity) {
      const indexedEntity = await getIndexedEntity(wdId)
      const indexationTime = indexedEntity?._indexationTime
      const entityWasRecentlyIndexed = indexationTime && ((Date.now() - indexationTime) < minReindexationInterval)
      if (entityWasRecentlyIndexed && indexedEntity.lastrevid === formattedEntity.lastrevid) {
        info(`wd entity indexation worker skipped (too recently reindexed): ${wdId}`)
      } else {
        formattedEntity._indexationTime = Date.now()
        formattedEntity._id = wdId
        await reindexWdEntity(formattedEntity)
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

async function getIndexedEntity (wdId) {
  const url = getIndexedDocUrl(indexName, wdId)
  try {
    const { _source } = await requests_.get(url)
    return _source
  } catch (err) {
    if (err.statusCode !== 404) throw err
  }
}

const wdEntitiesIndexationJobQueue = initJobQueue('wd:entity:indexation', entitiesIndexationWorker, 1)

export function addWdEntityToIndexationQueue (wdId) {
  wdEntitiesIndexationJobQueue.push(wdId)
}
