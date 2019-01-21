CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
entities_ = require '../entities'
getInvEntityCanonicalUri = require '../get_inv_entity_canonical_uri'

module.exports = (edition)->
  { isbn, labels, claims } = edition

  resolveIsbn isbn

resolveIsbn = (isbn)->
  unless isbn? then return Promise.resolved

  entities_.byIsbn isbn
  .then (entity)->
    if entity?
      uri = getInvEntityCanonicalUri(entity)[0]
      return uri
