// Get the amount of entities linking to a given entity
import _ from '#builders/utils'
import { getEntitiesByClaimsValue } from '#controllers/entities/lib/entities'
import runWdQuery from '#data/wikidata/run_query'

export default (uri, refresh) => {
  const [ prefix, id ] = uri.split(':')
  const promises = []

  if (prefix === 'wd') { promises.push(getWdLinksScore(id, refresh)) }

  promises.push(getLocalLinksCount(uri))

  return Promise.all(promises)
  .then(_.sum)
  .catch(_.ErrorRethrow('get links count err'))
}

const getWdLinksScore = (qid, refresh) => {
  return runWdQuery({ query: 'links-count', qid, refresh })
  .then(_.first)
}

const getLocalLinksCount = uri => getEntitiesByClaimsValue(uri, true)
