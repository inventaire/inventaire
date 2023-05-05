import _ from '#builders/utils'
import { defer } from '#lib/promises'

// Goal: Make one grouped request return several individual promises
// Use case: we got several entities to fetch on Wikidata at about the same time
// but the requests can't be merged upstream to keep cache per-entity
export default params => {
  const { delay, requester } = params

  let keys = []
  let groupedPromise = defer()
  let timeout
  const reset = () => {
    keys = []
    groupedPromise = defer()
    timeout = null
  }

  const getGroupedRequestPromise = () => {
    // If no timeout was set, it's the first request so it triggers the timeout
    // Every next request within this time will be grouped in the same grouped request
    if (!timeout) timeout = setTimeout(doGroupedRequest, delay)
    return groupedPromise.promise
  }

  const doGroupedRequest = async () => {
    const batch = keys
    console.log('🚀 ~ file: request_grouper.js ~ line', 28, 'doGroupedRequest ~ ', { keys, batch })
    const batchPromise = groupedPromise
    reset()
    try {
      const results = await requester(batch)
      console.log('🚀 ~ file: request_grouper.js ~ line', 33, 'doGroupedRequest ~ ', { results })
      batchPromise.resolve(results)
    } catch (err) {
      console.log('🚀 ~ file: request_grouper.js ~ line', 36, 'doGroupedRequest ~ ', { err })
      batchPromise.reject(err)
    }
  }

  // This is the request grouped only interface:
  // make a request for a single piece, get the result for this single piece.
  // The request grouper abstract all the rest, namely the request grouping
  return key => {
    keys.push(key)
    console.log('🚀 ~ file: request_grouper.js ~ line', 37, { key, keys })

    return getGroupedRequestPromise()
    .then(_.property(key))
    // Prevent several consumers requesting the same object
    // as it could create conflicts
    .then(_.cloneDeep)
  }
}
