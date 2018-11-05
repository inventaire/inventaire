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
  .then (entity)-> createItem(oauth, entity)
  .then (res)->
    unless res then return {}
    itemUri = prefixifyWd res.entity.id
    turnIntoRedirection reqUserId, entityId, itemUri
    return { uri: itemUri }

validateWikidataCompliance = (entity)->
  { labels, claims, type } = entity

  unless claims? then throw error_.new 'invalid entity', 400, entity

  for property, values in claims
    unless properties[property].datatype is 'entity'
      throw error_.reject "invalid datatype for #{entity}", 400

    for value in values
      if value.split(":")[0] isnt 'inv'
        throw error_.reject "claim #{claim} has a value with an inventaire Uri", 400

  return entity

createItem = (oauth, entity)->
  unless entity then return false
  # wdEdit({ oauth }, 'entity/create')(entity)
  {"entity":{ "id":"Q261281", "type":"work" }}
