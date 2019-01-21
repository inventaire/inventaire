CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
properties = require '../properties/properties_values_constraints'
responses_ = __.require 'lib', 'responses'
error_ = __.require 'lib', 'error/error'

# Validate and format
module.exports = (res)-> (entry)->
  { edition, works, authors } = entry
  sanitizeEntityDraft res, edition
  sanitizeCollection res, entry, 'works'
  sanitizeCollection res, entry, 'authors'
  return entry

sanitizeCollection = (res, entry, name)->
  collection = entry[name] ?= []
  collection.forEach (entity)-> sanitizeEntityDraft res, entity

sanitizeEntityDraft = (res, entity)->
  entity.labels ?= {}
  unless _.isPlainObject entity.labels
    throw error_.new 'invalid labels', 400, { entity }

  entity.claims ?= {}
  unless _.isPlainObject entity.claims
    throw error_.new 'invalid claims', 400, { entity }

  sanitizeClaims res, entity.claims

sanitizeClaims = (res, claims)->
  Object.keys(claims).forEach (prop)->
    unless properties[prop]?
      responses_.addWarning res, 'resolver', "unknown property: #{prop}"
      delete claims[prop]
