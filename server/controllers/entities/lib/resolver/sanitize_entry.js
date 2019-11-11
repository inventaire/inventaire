// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const { isValidIsbn, normalizeIsbn } = __.require('lib', 'isbn/isbn')
const wdLang = require('wikidata-lang')
const properties = require('../properties/properties_values_constraints')
const validateClaimValueSync = require('../validate_claim_value_sync')
const { validateProperty } = require('../properties/validations')

// Validate : requires only one edition to resolve from and a valid isbn
// Format : if edition is a list, force pick the first edition
// Warn : when a property is unknown

module.exports = function(entry){
  let { edition } = entry

  if (_.isArray(edition)) {
    if (edition.length > 1) throw error_.new('multiple editions not supported', 400, { edition })
    else { edition = (entry.edition = edition[0]) }
  }

  if (edition == null) {
    throw error_.new('missing edition in entry', 400, { entry })
  }

  const authorsSeeds = entry['authors'] != null ? entry['authors'] : (entry['authors'] = [])

  if (!_.isNonEmptyArray(entry['works'])) {
    const work = createWorkSeedFromEdition(edition)
    entry['works'] = (work != null) ? [ work ] : []
  }

  sanitizeEdition(entry.edition)
  sanitizeCollection(authorsSeeds, 'human')
  sanitizeCollection(entry.works, 'work')
  return entry
}

var sanitizeEdition = function(edition){
  const rawIsbn = getIsbn(edition)

  sanitizeSeed(edition, 'edition')

  if (rawIsbn != null) {
    if (!isValidIsbn(rawIsbn)) throw error_.new('invalid isbn', 400, { edition })
    return edition.isbn = normalizeIsbn(rawIsbn)
  } else {
    const claims = edition.claims || {}
    const claimsProperties = Object.keys(claims)
    const externalIdProperties = claimsProperties.filter(isExternalIdProperty)
    if (!_.some(claimsProperties, isExternalIdProperty)) {
      throw error_.new('no isbn or external id claims found', 400, { edition })
    }
  }
}

var isExternalIdProperty = propertyId => properties[propertyId].isExternalId

var sanitizeCollection = (seeds, type) => seeds.forEach(seed => sanitizeSeed(seed, type))

var sanitizeSeed = function(seed, type){
  if (seed.labels == null) { seed.labels = {} }
  if (!_.isPlainObject(seed.labels)) {
    throw error_.new('invalid labels', 400, { seed })
  }

  for (const lang in seed.labels) {
    const label = seed.labels[lang]
    if (!_.isLang(lang)) {
      throw error_.new('invalid label lang', 400, { lang, label })
    }

    if (!_.isNonEmptyString(label)) {
      throw error_.new('invalid label', 400, { lang, label })
    }
  }

  const claims = seed.claims != null ? seed.claims : (seed.claims = {})
  if (!_.isPlainObject(seed.claims)) {
    throw error_.new('invalid claims', 400, { seed })
  }

  return Object.keys(claims).forEach((prop) => {
    validateProperty(prop)
    claims[prop] = _.forceArray(claims[prop])
    return claims[prop].forEach(value => validateClaimValueSync(prop, value, type))
  })
}

var getIsbn = edition => edition.isbn || (edition.claims != null ? edition.claims['wdt:P212'] : undefined) || (edition.claims != null ? edition.claims['wdt:P957'] : undefined)

var createWorkSeedFromEdition = function(edition){
  let lang
  if (__guard__(edition.claims != null ? edition.claims['wdt:P1476'] : undefined, x => x[0]) == null) return
  const title = edition.claims['wdt:P1476'][0]
  const langWdId = edition.claims['wdt:P407'] != null ? edition.claims['wdt:P407'][0].split(':')[1] : undefined
  if (langWdId != null) { lang = wdLang.byWdId[langWdId] != null ? wdLang.byWdId[langWdId].code : undefined }
  if (lang == null) { lang = isbn_.guessLangFromIsbn(edition.isbn) }
  if (lang == null) { lang = 'en' }
  return { labels: { [lang]: title } }
}

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined
}