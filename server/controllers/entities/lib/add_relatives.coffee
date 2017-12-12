# Enrich ../by_uris results with entities related to the directly
# requested entities, following those entities claims

__ = require('config').universalPath
_ = __.require 'builders', 'utils'
getEntitiesByUris = require './get_entities_by_uris'

module.exports = (relatives, refresh)->
  unless relatives? then return _.identity

  addRelatives = (results)->
    { entities } = results

    additionalEntitiesUris = getAdditionalEntitiesUris entities, relatives

    if additionalEntitiesUris.length is 0 then return results

    getEntitiesByUris additionalEntitiesUris, refresh
    # Recursively add relatives, so that an edition could be sent
    # with its works, and its works authors and series
    .then addRelatives
    .then (additionalResults)->
      # We only need to extend entities, as those additional URIs
      # should already be the canonical URIs (no redirection needed)
      # and all URIs should resolve to an existing entity
      _.extend results.entities, additionalResults.entities
      return results

  return addRelatives

getAdditionalEntitiesUris = (entities, relatives)->
  additionalEntitiesUris = []

  for uri, entity of entities
    for relative in relatives
      propUris = entity.claims[relative]
      if propUris?
        for propUri in propUris
          unless entities[propUri]? then additionalEntitiesUris.push propUri

  return _.uniq additionalEntitiesUris
