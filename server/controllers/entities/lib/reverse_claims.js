const __ = require('config').universalPath
const _ = require('builders/utils')
const error_ = require('lib/error/error')
const assert_ = require('lib/utils/assert_types')
const wdk = require('wikidata-sdk')
const requests_ = require('lib/requests')
const entities_ = require('./entities')
const { prefixifyWd, unprefixify } = require('controllers/entities/lib/prefix')
const cache_ = require('lib/cache')
const getInvEntityCanonicalUri = require('./get_inv_entity_canonical_uri')
const runWdQuery = require('data/wikidata/run_query')
const { getEntitiesPopularities } = require('./popularity')

const caseInsensitiveProperties = [
  'wdt:P2002'
]

const denylistedProperties = [
  // Too many results, can't be sorted
  'wdt:P31',
  'wdt:P407'
]

const localOnlyProperties = [
  // Avoid getting editions from Wikidata
  // as those are quarantined https://github.com/inventaire/inventaire/issues/182
  'wdt:P629',
  'wdt:P123',
  'wdt:P195'
]

module.exports = async params => {
  const { property, value, refresh, sort, dry } = params
  assert_.strings([ property, value ])

  if (denylistedProperties.includes(property)) {
    throw error_.new('denylisted property', 400, { property })
  }

  const promises = []

  if (!localOnlyProperties.includes(property)) {
    promises.push(requestWikidataReverseClaims(property, value, refresh, dry))
  }

  promises.push(invReverseClaims(property, value))

  return Promise.all(promises)
  .then(_.flatten)
  .then(_.compact)
  .then(uris => {
    if (!sort) return uris

    return getEntitiesPopularities({ uris })
    .then(scores => uris.sort(sortByScore(scores)))
  })
}

const requestWikidataReverseClaims = (property, value, refresh, dry) => {
  if (_.isEntityUri(value)) {
    const [ prefix, id ] = value.split(':')
    // If the prefix is 'inv' or 'isbn', no need to check Wikidata
    if (prefix === 'wd') return wikidataReverseClaims(property, id, refresh, dry)
  } else {
    return wikidataReverseClaims(property, value, refresh, dry)
  }
}

const wikidataReverseClaims = async (property, value, refresh, dry) => {
  const type = typeTailoredQuery[property]
  if (type != null) {
    const pid = property.split(':')[1]
    const results = await runWdQuery({ query: `${type}_reverse_claims`, pid, qid: value, refresh, dry })
    return results.map(prefixifyWd)
  } else {
    return generalWikidataReverseClaims(property, value, refresh, dry)
  }
}

const generalWikidataReverseClaims = (property, value, refresh, dry) => {
  const key = `wd:reverse-claim:${property}:${value}`
  const fn = _wikidataReverseClaims.bind(null, property, value)
  return cache_.get({ key, fn, refresh, dry, dryFallbackValue: [] })
}

const _wikidataReverseClaims = async (property, value) => {
  const caseInsensitive = caseInsensitiveProperties.includes(property)
  const wdProp = unprefixify(property)
  _.log([ property, value ], 'reverse claim')
  const url = wdk.getReverseClaims(wdProp, value, { caseInsensitive })
  const results = await requests_.get(url)
  return wdk.simplifySparqlResults(results).map(prefixifyWd)
}

const invReverseClaims = async (property, value) => {
  try {
    const entities = await entities_.byClaim(property, value, true, true)
    return entities.map(getInvEntityCanonicalUri)
  } catch (err) {
    // Allow to request reverse claims for properties that aren't yet
    // allowlisted to be added to inv properties: simply ignore inv entities
    if (err.message === "property isn't allowlisted") return []
    else throw err
  }
}

// Customize queries to tailor for specific types of results
// Ex: 'wdt:P921' reverse claims should not include films, etc
// but only works or series
const typeTailoredQuery = {
  // country of citizenship
  'wdt:P27': 'humans',
  // educated at
  'wdt:P69': 'humans',
  // native language
  'wdt:P103': 'humans',
  // occupation
  'wdt:P106': 'humans',
  // publisher
  'wdt:P123': 'editions',
  // award received
  'wdt:P166': 'humans',
  // genre
  'wdt:P135': 'humans',
  // movement
  'wdt:P136': 'works',
  // collection
  'wdt:P195': 'editions',
  // language of work
  'wdt:P407': 'works',
  // translator
  'wdt:P655': 'editions',
  // characters
  'wdt:P674': 'works',
  // narrative location
  'wdt:P840': 'works',
  // main subject
  'wdt:P921': 'works',
  // inspired by
  'wdt:P941': 'works'
}

const sortByScore = scores => (a, b) => scores[b] - scores[a]
