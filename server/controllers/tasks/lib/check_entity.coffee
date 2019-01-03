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

module.exports = (uri)->
  getEntityByUri uri
  .then (entity)->
    unless entity? then throw error_.notFound { uri }

    if entity.uri.split(':')[0] is 'wd'
      throw error_.new 'entity is already a redirection', 400, { uri }

    getExistingTasks uri
    .then getNewTasks(entity)
    .then tasks_.createInBulk
    .tap -> updateRelationScore uri

getExistingTasks = (uri)-> tasks_.bySuspectUris [ uri ]
