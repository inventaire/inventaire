const _ = require('builders/utils')
const entities_ = require('./entities')
const { firstClaim, uniqByUri } = entities_
const runWdQuery = require('data/wikidata/run_query')
const { prefixifyWd } = require('controllers/entities/lib/prefix')
const { getSimpleDayDate, sortByOrdinalOrDate } = require('./queries_utils')
const { getCachedRelations } = require('./temporarily_cache_relations')

module.exports = params => {
  const { uri, refresh, dry } = params
  const [ prefix, id ] = uri.split(':')
  const promises = []

  // If the prefix is 'inv' or 'isbn', no need to check Wikidata
  if (prefix === 'wd') promises.push(getWdSerieParts(id, refresh, dry))

  promises.push(getInvSerieParts(uri))

  promises.push(getCachedRelations(uri, 'wdt:P179', formatEntity))

  return Promise.all(promises)
  .then(_.flatten)
  // There might be duplicates, mostly due to temporarily cached relations
  .then(uniqByUri)
  .then(results => ({
    parts: results.sort(sortByOrdinalOrDate)
  }))
  .catch(_.ErrorRethrow('get serie parts err'))
}

const getWdSerieParts = async (qid, refresh, dry) => {
  const results = await runWdQuery({ query: 'serie-parts', qid, refresh, dry })
  return results.map(result => ({
    uri: prefixifyWd(result.part),
    date: getSimpleDayDate(result.date),
    ordinal: result.ordinal,
    subparts: result.subparts,
    superpart: prefixifyWd(result.superpart)
  }))
}

// Querying only for 'serie' (wdt:P179) and not 'part of' (wdt:P361)
// as we use only wdt:P179 internally
const getInvSerieParts = async uri => {
  const docs = await entities_.byClaim('wdt:P179', uri, true, true)
  return docs.map(format)
}

const format = ({ _id, claims }) => ({
  uri: `inv:${_id}`,
  date: claims['wdt:P577'] && claims['wdt:P577'][0],
  ordinal: claims['wdt:P1545'] && claims['wdt:P1545'][0],
  subparts: 0
})

const formatEntity = entity => ({
  uri: entity.uri,
  date: firstClaim(entity, 'wdt:P577'),
  ordinal: firstClaim(entity, 'wdt:P1545')
})
