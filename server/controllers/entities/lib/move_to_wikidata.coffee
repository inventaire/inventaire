__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
entities_ = require './entities'
promises_ = __.require 'lib', 'promises'
getEntityType = require './get_entity_type'
wdEdit = require 'wikidata-edit'
{ wikidataOAuth } = require('config')
{ turnIntoRedirection } = require './merge_entities'
{ properties } = require './properties'
{ prefixifyWd, unprefixify } = require './prefix'

module.exports = (user, entityUri)->
  { oauth, _id:reqUserId } = user
  userWikidataOAuth = user.oauth?.wikidata
  unless userWikidataOAuth?
    throw error_.reject 'missing wikidata oauth tokens', 400
  oauth = _.extend userWikidataOAuth, wikidataOAuth

  entityId = unprefixify entityUri

  entities_.byId entityId
  .then validateWikidataCompliance
  .then wdEdit({ oauth }, 'entity/create')
  .then (res)->
    unless res.entity?
      throw error_.new('something wrong happened in wdEdit', 500, { entityUri, res })

    wdEntityUri = prefixifyWd res.entity.id

    turnIntoRedirection reqUserId, entityId, wdEntityUri
    return { uri: wdEntityUri }

validateWikidataCompliance = (entity)->
  { labels, claims, type } = entity

  unless claims? then throw error_.new 'invalid entity', 400, entity

  for property, values of claims
    unless properties[property].datatype is 'entity'
      throw error_.new 'invalid datatype', 400, { entity, property, values }

    for value in values
      if value.split(':')[0] isnt 'inv'
        throw error_.new 'claim value is an inv uri', 400, { property, value }

  return entity

createItem = (oauth, entity)->
  wdEdit({ oauth }, 'entity/create')(entity)
