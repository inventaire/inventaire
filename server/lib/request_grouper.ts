import { cloneDeep } from 'lodash-es'
import { defer } from '#lib/promises'
import { assertString } from '#lib/utils/assert_types'

// Goal: Make one grouped request return several individual promises
// Use case: we got several entities to fetch on Wikidata at about the same time
// but the requests can't be merged upstream to keep cache per-entity
export function requestGrouper <K, T> (params) {
  const { delay, requester } = params

  let keys = []
  let groupedPromise = defer()
  let timeout
  function reset () {
    keys = []
    groupedPromise = defer()
    timeout = null
  }

  function getGroupedRequestPromise () {
    // If no timeout was set, it's the first request so it triggers the timeout
    // Every next request within this time will be grouped in the same grouped request
    if (!timeout) timeout = setTimeout(doGroupedRequest, delay)
    return groupedPromise.promise
  }

  async function doGroupedRequest () {
    const batch = keys
    const batchPromise = groupedPromise
    reset()
    try {
      const results = await requester(batch)
      batchPromise.resolve(results)
    } catch (err) {
      batchPromise.reject(err)
    }
  }

  // This is the request grouped only interface:
  // make a request for a single piece, get the result for this single piece.
  // The request grouper abstract all the rest, namely the request grouping
  return async function (key: K) {
    assertString(key)
    keys.push(key)

    const groupedResults = await getGroupedRequestPromise()
    const keyResult = groupedResults?.[key]
    // Prevent several consumers requesting the same object
    // as it could create conflicts
    return cloneDeep(keyResult) as T
  }
}
