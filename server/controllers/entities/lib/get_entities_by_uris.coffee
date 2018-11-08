__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
wdk = require 'wikidata-sdk'
{ normalizeIsbn, isValidIsbn } = __.require 'lib', 'isbn/isbn'
{ prefixes:aliasesPrefixes, validators:aliasesValidators, looksLikeSitelink } = require './alias_uris'
aliasesGetter = require './get_entities_by_alias_uris'

# Getters take ids, return an object on the model { entities, notFound }
getters =
  inv: require './get_inv_entities'
  wd: require './get_wikidata_enriched_entities'
  isbn: require './get_entities_by_isbns'
  wmsite: require './get_wikidata_entites_by_sitelink'

getGetter = (prefix)-> getters[prefix] or aliasesGetter

prefixes = Object.keys(getters).concat aliasesPrefixes

module.exports = (uris, refresh)->
  domains = {}

  # validate per URI to be able to return a precise error message
  for uri in uris
    [ prefix, id ] = uri.split ':'

    unless prefix in prefixes
      if looksLikeSitelink prefix
        prefix = 'wmsite'
      else
        errMessage = "invalid uri prefix: #{prefix} (uri: #{uri})"
        return error_.reject errMessage, 400, uri

    unless validators[prefix](id)
      errMessage = "invalid uri id: #{id} (uri: #{uri})"
      return error_.reject errMessage, 400, uri

    # Alias getters require the full URI as it handles multiple prefixes
    if prefix in aliasesPrefixes or prefix is 'wmsite' then value = uri
    else value = id

    domains[prefix] or= []
    domains[prefix].push value

  getDomainsPromises domains, refresh
  .then mergeResponses
  .catch _.ErrorRethrow("getEntitiesByUris err: #{uris.join('|')}")

getDomainsPromises = (domains, refresh)->
  promises = []
  for prefix, uris of domains
    promises.push getGetter(prefix)(uris, refresh)

  return promises_.all promises

mergeResponses = (results)->
  response =
    # entities are a array until they are indexed by uri hereafter
    entities: []
    # collect redirections at the response root to let the possibility
    # to the client to alias entities
    redirects: {}
    notFound: []

  for result in results
    _.type result.entities, 'array'
    for entity in result.entities
      if entity.redirects?
        { from, to } = entity.redirects
        _.types [ from, to ], 'strings...'
        response.redirects[from] = to
        delete entity.redirects

    # concat all entities
    response.entities = response.entities.concat result.entities

    # concat the list of not found URIs
    if result.notFound?
      response.notFound = response.notFound.concat result.notFound

  response.entities = _.keyBy response.entities, 'uri'

  if response.notFound.length is 0 then delete response.notFound

  return response

validators = _.extend {}, aliasesValidators,
  inv: _.isInvEntityId
  wd: wdk.isItemId
  isbn: isValidIsbn
