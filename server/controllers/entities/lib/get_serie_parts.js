import { flatten } from 'lodash-es'
import { getInvEntitiesByClaim, getFirstPropertyClaim, uniqByUri } from '#controllers/entities/lib/entities'
import { prefixifyWd } from '#controllers/entities/lib/prefix'
import runWdQuery from '#data/wikidata/run_query'
import { LogErrorAndRethrow } from '#lib/utils/logs'
import { getSimpleDayDate, sortByOrdinalOrDate } from './queries_utils.js'
import { getCachedRelations } from './temporarily_cache_relations.js'

export default params => {
  const { uri, refresh, dry, useCacheRelations = true } = params
  const [ prefix, id ] = uri.split(':')
  const promises = []

  // If the prefix is 'inv' or 'isbn', no need to check Wikidata
  if (prefix === 'wd') promises.push(getWdSerieParts(id, refresh, dry))

  promises.push(getInvSerieParts(uri))

  if (useCacheRelations) promises.push(getCachedRelations(uri, 'wdt:P179', formatEntity))

  return Promise.all(promises)
  .then(flatten)
  // There might be duplicates, mostly due to temporarily cached relations
  .then(uniqByUri)
  .then(results => ({
    parts: results.sort(sortByOrdinalOrDate),
  }))
  .catch(LogErrorAndRethrow('get serie parts err'))
}

const getWdSerieParts = async (qid, refresh, dry) => {
  const results = await runWdQuery({ query: 'serie-parts', qid, refresh, dry })
  return results.map(result => ({
    uri: prefixifyWd(result.part),
    date: getSimpleDayDate(result.date),
    ordinal: result.ordinal,
    subparts: result.subparts,
    superpart: prefixifyWd(result.superpart),
  }))
}

// Querying only for 'serie' (wdt:P179) and not 'part of' (wdt:P361)
// as we use only wdt:P179 internally
const getInvSerieParts = async uri => {
  const docs = await getInvEntitiesByClaim('wdt:P179', uri, true, true)
  return docs.map(format)
}

const format = ({ _id, claims }) => ({
  uri: `inv:${_id}`,
  date: claims['wdt:P577'] && claims['wdt:P577'][0],
  ordinal: claims['wdt:P1545'] && claims['wdt:P1545'][0],
  subparts: 0,
})

const formatEntity = entity => ({
  uri: entity.uri,
  date: getFirstPropertyClaim(entity, 'wdt:P577'),
  ordinal: getFirstPropertyClaim(entity, 'wdt:P1545'),
})
