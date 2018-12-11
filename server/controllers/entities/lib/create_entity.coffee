__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
entities_ = require './entities'
{ Lang } = __.require 'lib', 'regex'
promises_ = __.require 'lib', 'promises'
{ Track } = __.require 'lib', 'track'
getEntityType = require './get_entity_type'
validateClaimProperty = require './validate_claim_property'
typesWithoutLabels = require './types_without_labels'

module.exports = (labels, claims, userId)->
  _.types arguments, ['object', 'object', 'string']
  _.log arguments, 'entity to create'

  promises_.try -> validateType claims['wdt:P31']
  .tap (type)-> validateLabels labels, claims, type
  .then (type)-> validateClaims claims, type
  .then entities_.create
  .then entities_.edit.bind(null, userId, labels, claims)

validateType = (wdtP31)->
  unless _.isNonEmptyArray wdtP31
    throw error_.new "wdt:P31 array can't be empty", 400, wdtP31

  type = getEntityType wdtP31
  unless type?
    throw error_.new "wdt:P31 value isn't a known valid value", 400, wdtP31

  return type

validateLabels = (labels, claims, type)->
  if type in typesWithoutLabels
    if _.isNonEmptyPlainObject labels
      throw error_.new "#{type}s can't have labels", 400, labels
  else
    unless _.isNonEmptyPlainObject labels
      throw error_.new 'invalid labels', 400, labels

    for lang, value of labels
      unless Lang.test lang
        throw error_.new "invalid label language: #{lang}", 400, labels

      unless _.isNonEmptyString value
        throw error_.new "invalid label value: #{value}", 400, labels

validateClaims = (claims, type)->
  unless _.isNonEmptyPlainObject claims
    throw error_.new 'invalid claims', 400, claims

  typeTestFn = perTypeClaimsTests[type] or _.noop
  typeTestFn claims

  promises = []
  currentClaims = {}
  oldVal = null

  for property, array of claims
    validateClaimProperty type, property

    unless _.isArray array
      throw error_.new 'invalid property array', 400, { property, array }

    claims[property] = array = _.uniq array
    for newVal in array
      params = { currentClaims, property, oldVal, newVal, letEmptyValuePass: false }
      promises.push entities_.validateClaim(params)

  return promises_.all promises

perTypeClaimsTests =
  edition: (claims)->
    entityLabel = 'an edition'
    assertPropertyHasValue claims, 'wdt:P629', entityLabel, 'an associated work'
    assertPropertyHasValue claims, 'wdt:P1476', entityLabel, 'a title'
    return

assertPropertyHasValue = (claims, property, entityLabel, propertyLabel)->
  unless claims[property]?[0]?
    message = "#{entityLabel} should have #{propertyLabel} (#{property})"
    throw error_.new message, 400, claims

  return
