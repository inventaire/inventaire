__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
entities_ = __.require 'controllers', 'entities/lib/entities'
tasks_ = __.require 'controllers', 'tasks/lib/tasks'

getEntitiesByUris = __.require 'controllers', 'entities/lib/get_entities_by_uris'
checkEntities = __.require 'controllers', 'tasks/lib/check_entities'

urify = (entity)-> "inv:#{entity['entity']}"

module.exports = (req, res)->
   # TODO: bulk 100 entities each
  entities_.byClaimsValue "wd:Q5"
  .then (results)-> getEntitiesByUris results.map(urify)
  .then (entities)-> checkEntities entities.entities
  .then tasks_.keepNewTasks
  .map tasks_.create
  .then _.Ok(res)
  .catch error_.Handler(req, res)
