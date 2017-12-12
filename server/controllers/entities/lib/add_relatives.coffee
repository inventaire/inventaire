# Enrich ../by_uris results with entities related to the directly
# requested entities, following those entities claims.

__ = require('config').universalPath
_ = __.require 'builders', 'utils'
getEntitiesByUris = require './get_entities_by_uris'

module.exports = (relatives, refresh)-> (results)->
  { entities } = results
  unless relatives? then return results

  additionalEntitiesUris = []

  for uri, entity of entities
    for relative in relatives
      propUris = entity.claims[relative]
      if propUris?
        for propUri in propUris
          unless entities[propUri]? then additionalEntitiesUris.push propUri

  if additionalEntitiesUris.length is 0 then return results

  getEntitiesByUris _.uniq(additionalEntitiesUris), refresh
  .then (additionalResults)->
    # We only need to extend entities, as those additional URIs
    # should already be the canonical URIs (no redirection needed)
    # and all URIs should resolve to an existing entity
    _.extend results.entities, additionalResults.entities
    return results
