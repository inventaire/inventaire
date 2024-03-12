import { map } from 'lodash-es'
import { initJobQueue } from '#db/level/jobs'
import { isEntityUri } from '#lib/boolean_validations'
import { cache_ } from '#lib/cache'
import { newError } from '#lib/error/error'
import { waitForCPUsLoadToBeBelow } from '#lib/os'
import { objectPromise } from '#lib/promises'
import { oneMonth } from '#lib/time'
import { info, logError } from '#lib/utils/logs'
import CONFIG from '#server/config'
import type { EntityUri } from '#types/entity'
import { buildPopularityByUri } from './build_popularity_by_uri.js'

const { nice } = CONFIG
// Give a longer than default life time to cached value, as:
// - popularity freshness can be considered secondary
// - populating a popularity score can be relatively expensive, as it might require fetching a large graph of entities
// - a popularity score being just an integer, it is extremely cheap to keep in store
const ttl = 6 * oneMonth

export async function getEntitiesPopularities ({ uris, refresh }: { uris: EntityUri[], refresh?: boolean}) {
  if (uris.length === 0) return {}
  const popularityPromises = {}
  for (const uri of uris) {
    popularityPromises[uri] = getEntityPopularity({ uri, refresh })
  }
  return objectPromise(popularityPromises)
}

const noPopularityCached = Symbol('no-popularity-cached')

export async function getEntityPopularity ({ uri, refresh = false, populateCacheOnCacheMiss = true }) {
  if (!isEntityUri(uri)) throw newError('invalid uri', 400, uri)

  // Building a popularity score can take quite some time, and most consumers
  // just need a quick result, so unless explicity requested with refresh=true,
  // this call will return what's in cache. If nothing is in cache, a job will be scheduled
  // to later populate the cache, unless populateCacheOnCacheMiss=false
  const dry = !refresh

  const res = await cache_.get({
    key: `popularity:${uri}`,
    fn: buildPopularityByUri.bind(null, uri),
    ttl,
    refresh,
    dry,
    dryFallbackValue: noPopularityCached,
  })

  if (res === noPopularityCached) {
    if (populateCacheOnCacheMiss) {
      // info(`entity popularity not found, scheduling job to populate the cache: ${uri}`)
      popularityJobQueue.push(uri)
    } else {
      // info(`entity popularity not found, but populateCacheOnCacheMiss=false: no job scheduled: ${uri}`)
    }
    return 0
  } else {
    return res
  }
}

async function popularityWorker (jobId, uri) {
  try {
    // info(`popularity worker pending: ${uri}`)
    // Run the worker when the CPUs activity is below 50% load
    // to give the priority to more urgent matters,
    // such as answering users requests
    if (nice) await waitForCPUsLoadToBeBelow({ threshold: 0.4 })
    // info(`popularity worker running: ${uri}`)
    const score = await cache_.get({
      key: `popularity:${uri}`,
      fn: buildPopularityByUri.bind(null, uri),
      ttl,
      // If somehow, a value as been cached since this job was schedule,
      // the cache is populated, no need to refresh that value
      refresh: false,
      dry: false,
    })
    info(`popularity worker done: ${uri}=${score}`)
  } catch (err) {
    logError(err, 'popularityWorker err')
    throw err
  }
}

const popularityJobQueue = initJobQueue('entity:popularity', popularityWorker, 1)

export async function addEntitiesPopularities ({ entities, refresh }) {
  const uris = map(entities, 'uri')
  const scoresByUri = await getEntitiesPopularities({ uris, refresh })
  entities.forEach(entity => {
    entity.popularity = scoresByUri[entity.uri]
  })
}
