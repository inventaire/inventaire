__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
assert_ = __.require 'utils', 'assert_types'
entities_ = require './entities'
{ Lang } = __.require 'lib', 'regex'
promises_ = __.require 'lib', 'promises'
getEntityType = require './get_entity_type'
validateClaims =  require './validate_claims'
typesWithoutLabels = require './types_without_labels'

module.exports = (entity)->
  promises_.try ->
    { labels, claims } = entity
    assert_.object labels
    assert_.object claims

    type = getValueType claims
    validateValueType type, claims['wdt:P31']
    validateLabels labels, type
    return validateClaims { newClaims: claims, currentClaims: {}, creating: true }

getValueType = (claims)->
  wdtP31 = claims['wdt:P31']
  unless _.isNonEmptyArray wdtP31
    throw error_.new "wdt:P31 array can't be empty", 400, wdtP31
  return getEntityType wdtP31

validateValueType = (type, wdtP31)->
  unless type?
    throw error_.new "wdt:P31 value isn't a known valid value", 400, wdtP31

validateLabels = (labels, type)->
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
