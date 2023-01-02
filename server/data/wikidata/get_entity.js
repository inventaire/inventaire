// A request regrouper to query entities full data one by one
// while requests are actually regrouped in the background
import wdk from 'wikidata-sdk'
import _ from '#builders/utils'
import requestGrouper from '#lib/request_grouper'
import { requests_ } from '#lib/requests'

const { getEntities, getManyEntities } = wdk

const requester = ids => {
  if (ids.length > 50) {
    // Using getManyEntities to work around the 50 entities limit
    // But, normally, caching should allow to limit its use to some
    // exceptionnal requests (like when someone wants refreshed data
    // of the whole Victor Hugo bibliographie)
    const urls = getManyEntities(ids)
    _.log(urls, 'get many wikidata entities')
    return Promise.all(urls.map(getReq))
    .then(mergeResults)
  } else {
    const url = getEntities(ids)
    return getReq(url)
    .then(({ entities }) => entities)
  }
}

// Limiting arguments to strictly 1
const getReq = url => requests_.get(url)
const mergeResults = results => Object.assign(..._.map(results, 'entities'))

// Expose a single requester
// Taking a Wikidata Id
// Returning the corresponding entity object
export default requestGrouper({ requester, delay: 5 })
