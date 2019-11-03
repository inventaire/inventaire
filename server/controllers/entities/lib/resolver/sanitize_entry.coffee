CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
responses_ = __.require 'lib', 'responses'
error_ = __.require 'lib', 'error/error'
{ isValidIsbn, normalizeIsbn } = __.require 'lib', 'isbn/isbn'
wdLang = require 'wikidata-lang'
properties = require '../properties/properties_values_constraints'
validateClaimValueSync = require '../validate_claim_value_sync'
{ validateProperty } = require '../properties/validations'

# Validate : requires only one edition to resolve from and a valid isbn
# Format : if edition is a list, force pick the first edition
# Warn : when a property is unknown

module.exports = (entry)->
  { edition } = entry

  if _.isArray edition
    if edition.length > 1 then throw error_.new 'multiple editions not supported', 400, { edition }
    else edition = entry.edition = edition[0]

  unless edition?
    throw error_.new 'missing edition in entry', 400, { entry }

  authorsSeeds = entry['authors'] ?= []

  unless _.isNonEmptyArray entry['works']
    work = createWorkSeedFromEdition edition
    entry['works'] = if work? then [ work ] else []

  sanitizeEdition entry.edition
  sanitizeCollection authorsSeeds, 'human'
  sanitizeCollection entry.works, 'work'
  return entry

sanitizeEdition = (edition)->
  rawIsbn = getIsbn edition

  sanitizeSeed edition, 'edition'

  if rawIsbn?
    unless isValidIsbn(rawIsbn) then throw error_.new 'invalid isbn', 400, { edition }
    edition.isbn = normalizeIsbn rawIsbn
  else
    claims = edition.claims or {}
    claimsProperties = Object.keys claims
    externalIdProperties = claimsProperties.filter isExternalIdProperty
    unless _.some claimsProperties, isExternalIdProperty
      throw error_.new 'no isbn or external id claims found', 400, { edition }

isExternalIdProperty = (propertyId)-> properties[propertyId].isExternalId

sanitizeCollection = (seeds, type)->
  seeds.forEach (seed)-> sanitizeSeed seed, type

sanitizeSeed = (seed, type)->
  seed.labels ?= {}
  unless _.isPlainObject seed.labels
    throw error_.new 'invalid labels', 400, { seed }

  for lang, label of seed.labels
    unless _.isLang lang
      throw error_.new 'invalid label lang', 400, { lang, label }

    unless _.isNonEmptyString label
      throw error_.new 'invalid label', 400, { lang, label }

  claims = seed.claims ?= {}
  unless _.isPlainObject seed.claims
    throw error_.new 'invalid claims', 400, { seed }

  Object.keys(claims).forEach (prop)->
    validateProperty prop
    claims[prop] = _.forceArray claims[prop]
    claims[prop].forEach (value)-> validateClaimValueSync prop, value, type

getIsbn = (edition)->
  edition.isbn or edition.claims?['wdt:P212'] or edition.claims?['wdt:P957']

createWorkSeedFromEdition = (edition)->
  unless edition.claims?['wdt:P1476']?[0]? then return
  title = edition.claims['wdt:P1476'][0]
  langWdId = edition.claims['wdt:P407']?[0].split(':')[1]
  if langWdId? then lang = wdLang.byWdId[langWdId]?.code
  unless lang? then lang = isbn_.guessLangFromIsbn edition.isbn
  lang ?= 'en'
  return { labels: { "#{lang}": title } }
