__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
entities_ = require './entities'
{ Lang } = __.require 'models', 'tests/regex'
promises_ = __.require 'lib', 'promises'
{ Track } = __.require 'lib', 'track'

module.exports = (labels, claims, userId)->
  _.types arguments, ['object', 'object', 'string']
  _.log arguments, 'entity to create'

  promises_.try -> validateLabels labels, claims
  .then -> validateClaims claims
  .then entities_.create
  .then entities_.edit.bind(null, userId, labels, claims)

validateLabels = (labels, claims)->
  type = claims['wdt:P31']?[0]
  if type not in optionalLabelsTypes and not _.isNonEmptyPlainObject labels
    throw error_.new 'invalid labels', 400, labels

  for lang, value of labels
    unless Lang.test lang
      throw error_.new "invalid label language: #{lang}", 400, labels

    unless _.isNonEmptyString value
      throw error_.new "invalid label value: #{value}", 400, labels

optionalLabelsTypes = [
  # editions can borrow their label to the work they are bound to
  'wd:Q3331189'
]

validateClaims = (claims)->
  unless _.isNonEmptyPlainObject claims
    return error_.reject 'invalid claims', 400, labels

  promises = []

  claims = Object.freeze {}
  oldVal = null

  for property, array of claims
    for newVal in array
      promises.push entities_.validateClaim({ claims, property, oldVal, newVal, letEmptyValuePass: false })

  return promises_.all promises
