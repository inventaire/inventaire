// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const assert_ = __.require('utils', 'assert_types')
const wdk = require('wikidata-sdk')
const promises_ = __.require('lib', 'promises')
const requests_ = __.require('lib', 'requests')
const entities_ = require('./entities')
const { prefixifyWd, unprefixify } = __.require('controllers', 'entities/lib/prefix')
const cache_ = __.require('lib', 'cache')
const getInvEntityCanonicalUri = require('./get_inv_entity_canonical_uri')
const couch_ = __.require('lib', 'couch')
const runWdQuery = __.require('data', 'wikidata/run_query')
const getEntitiesPopularity = require('./get_entities_popularity')

const caseInsensitiveProperties = [
  'wdt:P2002'
]

const blacklistedProperties = [
  // Too many results, can't be sorted
  'wdt:P31',
  'wdt:P407'
]

const localOnlyProperties = [
  'wdt:P629',
  'wdt:P123'
]

module.exports = function(params){
  const { property, value, refresh, sort, dry } = params
  assert_.strings([ property, value ])

  if (blacklistedProperties.includes(property)) {
    return error_.reject('blacklisted property', 400, { property })
  }

  const promises = []

  if (!localOnlyProperties.includes(property)) {
    promises.push(requestWikidataReverseClaims(property, value, refresh, dry))
  }

  promises.push(invReverseClaims(property, value))

  return promises_.all(promises)
  .then(_.flatten)
  .then(_.compact)
  .then((uris) => {
    if (!sort) return uris

    return getEntitiesPopularity(uris)
    .then(scores => uris.sort(sortByScore(scores)))
  })
}

var requestWikidataReverseClaims = function(property, value, refresh, dry){
  if (_.isEntityUri(value)) {
    const [ prefix, id ] = Array.from(value.split(':'))
    // If the prefix is 'inv' or 'isbn', no need to check Wikidata
    if (prefix === 'wd') return wikidataReverseClaims(property, id, refresh, dry)
  } else {
    return wikidataReverseClaims(property, value, refresh, dry)
  }
}

var wikidataReverseClaims = function(property, value, refresh, dry){
  const type = typeTailoredQuery[property]
  if (type != null) {
    const pid = property.split(':')[1]
    return runWdQuery({ query: `${type}_reverse_claims`, pid, qid: value, refresh, dry })
    .map(prefixifyWd)
  } else {
    return generalWikidataReverseClaims(property, value, refresh, dry)
  }
}

var generalWikidataReverseClaims = function(property, value, refresh, dry){
  const key = `wd:reverse-claim:${property}:${value}`
  const fn = _wikidataReverseClaims.bind(null, property, value)
  return cache_.get({ key, fn, refresh, dry, dryFallbackValue: [] })
}

var _wikidataReverseClaims = function(property, value){
  const caseInsensitive = caseInsensitiveProperties.includes(property)
  const wdProp = unprefixify(property)
  _.log([ property, value ], 'reverse claim')
  return requests_.get(wdk.getReverseClaims(wdProp, value, { caseInsensitive }))
  .then(wdk.simplifySparqlResults)
  .map(prefixifyWd)
}

var invReverseClaims = (property, value) => entities_.byClaim(property, value, true, true)
.map(getInvEntityCanonicalUri)
.catch((err) => {
  // Allow to request reverse claims for properties that aren't yet
  // whitelisted to be added to inv properties: simply ignore inv entities
  if (err.message === "property isn't whitelisted") { return []
  } else { throw err }
})

// Customize queries to tailor for specific types of results
// Ex: 'wdt:P921' reverse claims should not include films, etc
// but only works or series
var typeTailoredQuery = {
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
  // original language
  'wdt:P364': 'works',
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

var sortByScore = scores => (a, b) => scores[b] - scores[a]
