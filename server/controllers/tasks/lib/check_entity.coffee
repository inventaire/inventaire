CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
{ Promise } = __.require 'lib', 'promises'
getEntityByUri = __.require 'controllers', 'entities/lib/get_entity_by_uri'
tasks_ = require './tasks'
getNewTasks = require './get_new_tasks'
error_ = __.require 'lib', 'error/error'
updateRelationScore = require './relation_score'
supportedTypes = [ 'human' ]

module.exports = (uri)->
  if uri.split(':')[0] isnt 'inv'
    return error_.reject 'invalid uri domain', 400, { uri }

  getEntityByUri { uri }
  .then (entity)->
    unless entity? then throw error_.notFound { uri }

    if entity.uri.split(':')[0] is 'wd'
      throw error_.new 'entity is already a redirection', 400, { uri }

    if entity.type not in supportedTypes
      throw error_.new "unsupported type: #{entity.type}", 400, { uri, supportedTypes }

    getExistingTasks uri
    .then getNewTasks(entity)
    .then tasks_.createInBulk
    .tap -> updateRelationScore uri

getExistingTasks = (uri)-> tasks_.bySuspectUris [ uri ]
