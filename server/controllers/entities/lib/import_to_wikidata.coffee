CONFIG = require 'config'
__ = CONFIG.universalPath
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
entities_ = require './entities'
promises_ = __.require 'lib', 'promises'
# { Track } = __.require 'lib', 'track'
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
    return error_.reject 'missing wikidata oauth tokens', 400
  oauth = _.extend userWikidataOAuth, wikidataOAuth

  entityId = unprefixify entityUri

  entities_.byId entityId
  .then validateWikidataCompliance
  .then (entity)-> createItem(oauth, entity)
  .get 'entity'
  .then (wdItem)->
    unless wdItem then return {}
    itemUri = prefixifyWd wdItem
    itemUri = "wd:Q585"
    turnIntoRedirection reqUserId, entityId, itemUri

validateWikidataCompliance = (entity)->
  { labels, claims, type } = entity

  unless claims? then return false

  for claim in claims
    { property, values } = claim
    unless properties[property].datatype is 'entity'
      return false

    for value in values
      if value.split(":")[0] isnt 'inv'
        return error_.reject "claim #{claim} has a value with an inventaire Uri", 400

  return entity

createItem = (oauth, entity)->
  unless entity then return false
  # wdEdit({ oauth }, 'entity/create')(entity)
  {"entity":{ "id":"Q261281", "type":"work" }}
