CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
properties = require '../properties/properties_values_constraints'
responses_ = __.require 'lib', 'responses'
error_ = __.require 'lib', 'error/error'
isbn_ = __.require 'lib', 'isbn/isbn'
wdLang = require 'wikidata-lang'

# Validate : requires only one edition to resolve from and a valid isbn
# Format : if edition is a list, force pick the first edition
# Warn : when a property is unknown

module.exports = (res)-> (entry)->
  { edition } = entry
  unless edition?
    throw error_.new 'missing edition in entry', 400, entry

  if _.isArray edition
    if edition.length > 1
      responses_.addWarning res, 'resolver', 'multiple editions not supported, picked the first one'
    entry.edition = edition[0]

  authorsSeeds = entry['authors'] ?= []

  unless _.isNonEmptyArray entry['works']
    work = createWorkSeedFromEdition edition
    entry['works'] = if work? then [ work ] else []

  sanitizeEdition res, entry.edition
  sanitizeCollection res, authorsSeeds
  sanitizeCollection res, entry.works
  return entry

sanitizeEdition = (res, edition)->
  rawIsbn = getIsbn edition
  unless rawIsbn? then throw error_.new 'no isbn found', 400, { edition }
  unless isbn_.isValidIsbn(rawIsbn) then throw error_.new 'invalid isbn', 400, { edition }

  sanitizeSeed res, edition

sanitizeCollection = (res, seeds)->
  seeds.forEach (seed)-> sanitizeSeed res, seed

sanitizeSeed = (res, seed)->
  seed.labels ?= {}
  unless _.isPlainObject seed.labels
    throw error_.new 'invalid labels', 400, { seed }

  claims = seed.claims ?= {}
  unless _.isPlainObject seed.claims
    throw error_.new 'invalid claims', 400, { seed }

  Object.keys(claims).forEach (prop)->
    unless properties[prop]?
      responses_.addWarning res, 'resolver', "unknown property: #{prop}"
      delete claims[prop]
    claims[prop] = _.forceArray claims[prop]

getIsbn = (edition)->
  if edition.isbn then return edition.isbn
  if edition.claims and edition.claims['wdt:P212'] then edition.claims['wdt:P212']

createWorkSeedFromEdition = (edition)->
  unless edition.claims?['wdt:P1476']?[0]? then return
  title = edition.claims['wdt:P1476'][0]
  langUri = edition.claims['wdt:P407']?[0]
  if langUri? then lang = wdLang.byWdId[langUri]?.code
  unless lang? then lang = isbn_.guessLangFromIsbn edition.isbn
  lang ?= 'en'
  return { labels: { "#{lang}": title } }
