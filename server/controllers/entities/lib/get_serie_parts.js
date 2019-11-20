

const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const promises_ = __.require('lib', 'promises')
const entities_ = require('./entities')
const runWdQuery = __.require('data', 'wikidata/run_query')
const { prefixifyWd } = __.require('controllers', 'entities/lib/prefix')
const { getSimpleDayDate, sortByOrdinalOrDate } = require('./queries_utils')

module.exports = params => {
  const { uri, refresh, dry } = params
  const [ prefix, id ] = uri.split(':')
  const promises = []

  // If the prefix is 'inv' or 'isbn', no need to check Wikidata
  if (prefix === 'wd') { promises.push(getWdSerieParts(id, refresh, dry)) }

  promises.push(getInvSerieParts(uri))

  return promises_.all(promises)
  .then((...results) => ({
    parts: _.flatten(...Array.from(results || [])).sort(sortByOrdinalOrDate)
  }))
  .catch(_.ErrorRethrow('get serie parts err'))
}

const getWdSerieParts = (qid, refresh, dry) => runWdQuery({ query: 'serie-parts', qid, refresh, dry })
.map(result => ({
  uri: prefixifyWd(result.part),
  date: getSimpleDayDate(result.date),
  ordinal: result.ordinal,
  subparts: result.subparts,
  superpart: prefixifyWd(result.superpart)
}))

const getInvSerieParts = uri => // Querying only for 'serie' (wdt:P179) and not 'part of' (wdt:P361)
// as we use only wdt:P179 internally
  entities_.byClaim('wdt:P179', uri, true)
.get('rows')
.map(parseRow)

const parseRow = row => ({
  uri: `inv:${row.id}`,
  date: (row.doc.claims['wdt:P577'] != null ? row.doc.claims['wdt:P577'][0] : undefined),
  ordinal: (row.doc.claims['wdt:P1545'] != null ? row.doc.claims['wdt:P1545'][0] : undefined),
  subparts: 0
})
