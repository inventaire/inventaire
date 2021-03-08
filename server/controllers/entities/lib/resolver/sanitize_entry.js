const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = require('builders/utils')
const error_ = require('lib/error/error')
const isbn_ = require('lib/isbn/isbn')
const { isValidIsbn, normalizeIsbn } = require('lib/isbn/isbn')
const wdLang = require('wikidata-lang')
const properties = require('../properties/properties_values_constraints')
const validateClaimValueSync = require('../validate_claim_value_sync')
const { validateProperty } = require('../properties/validations')

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

const sanitizeSeed = (seed, type) => {
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

  const claims = seed.claims = seed.claims || {}

  if (!_.isPlainObject(claims)) {
    throw error_.new('invalid claims', 400, { seed })
  }

  if (seed.image != null) {
    if (type === 'edition') {
      if (!_.isUrl(seed.image)) {
        throw error_.new('invalid image url', 400, { seed })
      }
    } else {
      throw error_.new(`${type} can't have an image`, 400, { seed })
    }
  }

  return Object.keys(claims).forEach(prop => {
    validateProperty(prop)
    claims[prop] = _.forceArray(claims[prop])
    return claims[prop].forEach(value => validateClaimValueSync(prop, value, type))
  })
}

const getIsbn = edition => {
  const { isbn, claims } = edition
  if (isbn) return isbn
  const isbnClaims = claims['wdt:P212'] || claims['wdt:P957']
  if (isbnClaims) return isbnClaims[0]
}

const createWorkSeedFromEdition = edition => {
  const { claims } = edition
  const titleClaim = claims && claims['wdt:P1476'] && claims['wdt:P1476'][0]
  if (titleClaim == null) return
  const title = claims['wdt:P1476'][0]
  const langClaim = claims['wdt:P407'] && claims['wdt:P407'][0]
  const langWdId = langClaim ? langClaim.split(':')[1] : null
  let lang
  if (langWdId && wdLang.byWdId[langWdId]) lang = wdLang.byWdId[langWdId].code
  lang = lang || isbn_.guessLangFromIsbn(edition.isbn) || 'en'
  return {
    labels: {
      [lang]: title
    }
  }
}
