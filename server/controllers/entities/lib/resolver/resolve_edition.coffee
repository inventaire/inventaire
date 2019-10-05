CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
entities_ = require '../entities'
getInvEntityCanonicalUri = require '../get_inv_entity_canonical_uri'
resolveExternalIds = require './resolve_external_ids'
# Do not try to resolve edition on Wikidata while Wikidata editions are in quarantine
# cf https://github.com/inventaire/inventaire/issues/182
resolveOnWikidata = false

module.exports = (entry)->
  { isbn, claims } = entry.edition

  Promise.all [
    resolveByIsbn isbn
    resolveExternalIds claims, resolveOnWikidata
  ]
  .spread pickUriFromResolversResponses
  .then (uri)->
    if uri? then entry.edition.uri = uri
    return entry

resolveByIsbn = (isbn)->
  unless isbn? then return
  # Resolve directly on the database to avoid making undersired requests to dataseed
  entities_.byIsbn isbn
  .then (edition)-> if edition? then return getInvEntityCanonicalUri edition

pickUriFromResolversResponses = (uriFoundByIsbn, urisFoundByExternalIds)->
  # TODO: handle possible conflict between uriFoundByIsbn and urisFoundByExternalIds
  if uriFoundByIsbn? then return uriFoundByIsbn
  if urisFoundByExternalIds? and urisFoundByExternalIds.length is 1
    return urisFoundByExternalIds[0]
