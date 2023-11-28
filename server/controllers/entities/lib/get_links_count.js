// Get the amount of entities linking to a given entity
import { first, sum } from 'lodash-es'
import { getInvEntitiesByClaimsValue } from '#controllers/entities/lib/entities'
import runWdQuery from '#data/wikidata/run_query'
import { LogErrorAndRethrow } from '#lib/utils/logs'

export default (uri, refresh) => {
  const [ prefix, id ] = uri.split(':')
  const promises = []

  if (prefix === 'wd') { promises.push(getWdLinksScore(id, refresh)) }

  promises.push(getLocalLinksCount(uri))

  return Promise.all(promises)
  .then(sum)
  .catch(LogErrorAndRethrow('get links count err'))
}

const getWdLinksScore = (qid, refresh) => {
  return runWdQuery({ query: 'links-count', qid, refresh })
  .then(first)
}

const getLocalLinksCount = uri => getInvEntitiesByClaimsValue(uri, true)
