__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ aliases } = require './alias_uris'
reverseClaims = require './reverse_claims'
# getEntityByUri is a function to work around the circular dependency
# requiring it directly would create
getEntityByUri = -> require './get_entity_by_uri'
addRedirection = require './add_redirection'

module.exports = (uris, refresh)->
  Promise.all uris.map(getEntityFromAliasUri(refresh))
  .then (results)-> results.reduce mergeResults, { entities: [], notFound: [] }

getEntityFromAliasUri = (refresh)-> (uri)->
  getCanonicalUri uri, refresh
  .then (canonicalUri)->
    unless canonicalUri? then return { uri, notFound: true }

    getEntityByUri()(canonicalUri)
    .then addRedirection.bind(null, uri)
    .then (entity)-> { uri, entity }

getCanonicalUri = (uri, refresh)->
  [ prefix, value ] = uri.split ':'
  { property } = aliases[prefix]

  reverseClaims property, value, refresh
  # Assumes that their will be only one result
  .then (canonicalUris)-> canonicalUris[0]

mergeResults = (results, entityResult)->
  { uri, notFound, entity } = entityResult
  if notFound then results.notFound.push uri
  else results.entities.push entity
  return results
