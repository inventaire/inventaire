// A request regrouper to query entities full data one by one
// while requests are actually regrouped in the background
import { map, uniq } from 'lodash-es'
import wdk from 'wikibase-sdk/wikidata.org'
import { requestGrouper } from '#lib/request_grouper'
import { requests_ } from '#lib/requests'
import { log } from '#lib/utils/logs'

const { getEntities, getManyEntities } = wdk

const requester = async ids => {
  ids = uniq(ids)
  if (ids.length > 50) {
    // Using getManyEntities to work around the 50 entities limit
    // But, normally, caching should allow to limit its use to some
    // exceptionnal requests (like when someone wants refreshed data
    // of the whole Victor Hugo bibliography)
    const urls = getManyEntities({ ids })
    log(urls, 'get many wikidata entities')
    const results = await Promise.all(urls.map(getReq))
    return mergeResults(results)
  } else {
    const url = getEntities({ ids })
    const { entities } = await getReq(url)
    return entities
  }
}

// Limiting arguments to strictly 1
const getReq = url => requests_.get(url)
const mergeResults = results => Object.assign(...map(results, 'entities'))

// Expose a single requester
// Taking a Wikidata Id
// Returning the corresponding entity object
export const getWdEntity = requestGrouper({ requester, delay: 5 })
