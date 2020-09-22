const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const entities_ = require('./entities')
const runWdQuery = __.require('data', 'wikidata/run_query')
const { prefixifyWd } = __.require('controllers', 'entities/lib/prefix')
const { getSimpleDayDate, sortByOrdinalOrDate } = require('./queries_utils')

module.exports = params => {
  const { uri, refresh, dry } = params
  const [ prefix, id ] = uri.split(':')
  const promises = []

  // If the prefix is 'inv' or 'isbn', no need to check Wikidata
  if (prefix === 'wd') promises.push(getWdSerieParts(id, refresh, dry))

  promises.push(getInvSerieParts(uri))

  return Promise.all(promises)
  .then((...results) => ({
    parts: _.flatten(...results).sort(sortByOrdinalOrDate)
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
