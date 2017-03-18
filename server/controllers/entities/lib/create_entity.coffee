__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
entities_ = require './entities'
{ Lang } = __.require 'models', 'tests/regex'
promises_ = __.require 'lib', 'promises'
{ Track } = __.require 'lib', 'track'
{ types } = __.require 'lib', 'wikidata/aliases'

module.exports = (labels, claims, userId)->
  _.types arguments, ['object', 'object', 'string']
  _.log arguments, 'entity to create'

  promises_.try -> validateType claims['wdt:P31']
  .tap (type)-> validateLabels labels, claims, type
  .then (type)-> validateClaims claims, type
  .then entities_.create
  .then entities_.edit.bind(null, userId, labels, claims)

validateType = (wdtP31)->
  _.log wdtP31, 'wdtP31'
  unless _.isNonEmptyArray wdtP31
    throw error_.new "wdt:P31 array can't be empty", 400, wdtP31

  value = wdtP31[0]
  type = types[value]
  unless type?
    throw error_.new "wdt:P31 value isn't a known valid value", 400, wdtP31

  return type

validateLabels = (labels, claims, type)->
  if type not in optionalLabelsTypes and not _.isNonEmptyPlainObject labels
    throw error_.new 'invalid labels', 400, labels

  for lang, value of labels
    unless Lang.test lang
      throw error_.new "invalid label language: #{lang}", 400, labels

    unless _.isNonEmptyString value
      throw error_.new "invalid label value: #{value}", 400, labels

optionalLabelsTypes = [
  # editions can borrow their label to the work they are bound to
  'edition'
]

validateClaims = (claims, type)->
  unless _.isNonEmptyPlainObject claims
    throw error_.new 'invalid claims', 400, claims

  typeTestFn = perTypeClaimsTests[type] or _.noop
  typeTestFn claims

  promises = []
  currentClaims = {}
  oldVal = null

  for property, array of claims
    unless _.isArray array
      throw error_.new 'invalid property array', 400, { property, array }

    for newVal in array
      promises.push entities_.validateClaim({ currentClaims, property, oldVal, newVal, letEmptyValuePass: false })

  return promises_.all promises

perTypeClaimsTests =
  edition: (claims)->
    hasWork = claims['wdt:P629']?[0]?
    hasIsbn = claims['wdt:P212']?[0]?
    unless hasWork or hasIsbn
      throw error_.new 'an edition entity should have an associated work claim (wdt:P629) or an ISBN-13 (wdt:P212)', 400, claims
    return
