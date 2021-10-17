const _ = require('builders/utils')
const error_ = require('lib/error/error')
const isbn_ = require('lib/isbn/isbn')
const { isValidIsbn, normalizeIsbn } = require('lib/isbn/isbn')
const wmLanguageCodeByWdId = require('wikidata-lang/mappings/wm_code_by_wd_id.json')
const properties = require('../properties/properties_values_constraints')
const sanitizeSeed = require('./sanitize_seed')

// Validate : requires only one edition to resolve from and a valid isbn
// Format : if edition is a list, force pick the first edition
// Warn : when a property is unknown

module.exports = entry => {
  let { edition } = entry

  if (_.isArray(edition)) {
    if (edition.length > 1) throw error_.new('multiple editions not supported', 400, { edition })
    else { edition = (entry.edition = edition[0]) }
  }

  if (edition == null) {
    throw error_.new('missing edition in entry', 400, { entry })
  }

  const authorsSeeds = entry.authors != null ? entry.authors : (entry.authors = [])

  if (!_.isNonEmptyArray(entry.works)) {
    const work = createWorkSeedFromEdition(edition)
    entry.works = (work != null) ? [ work ] : []
  }

  sanitizeEdition(entry.edition)
  sanitizeCollection(authorsSeeds, 'human')
  sanitizeCollection(entry.works, 'work')
  return entry
}

const sanitizeEdition = edition => {
  sanitizeSeed(edition, 'edition')

  const rawIsbn = getIsbn(edition)

  if (rawIsbn != null) {
    if (!isValidIsbn(rawIsbn)) throw error_.new('invalid isbn', 400, { edition })
    edition.isbn = normalizeIsbn(rawIsbn)
  } else {
    const claims = edition.claims || {}
    const claimsProperties = Object.keys(claims)
    if (!_.some(claimsProperties, isExternalIdProperty)) {
      throw error_.new('no isbn or external id claims found', 400, { edition })
    }
  }
}

const isExternalIdProperty = propertyId => properties[propertyId].isExternalId

const sanitizeCollection = (seeds, type) => seeds.forEach(seed => sanitizeSeed(seed, type))

const getIsbn = edition => {
  const { isbn, claims } = edition
  if (isbn) return isbn
  const isbnClaims = claims['wdt:P212'] || claims['wdt:P957']
  if (isbnClaims) return isbnClaims[0]
}

const createWorkSeedFromEdition = edition => {
  const { claims } = edition
  const title = claims?.['wdt:P1476'] ? _.forceArray(claims['wdt:P1476'])[0] : null
  if (title == null) return
  const langClaim = claims['wdt:P407'] && _.forceArray(claims['wdt:P407'])[0]
  const langWdId = langClaim ? langClaim.split(':')[1] : null
  const lang = wmLanguageCodeByWdId[langWdId] || isbn_.guessLangFromIsbn(edition.isbn) || 'en'
  return {
    labels: {
      [lang]: title
    }
  }
}
