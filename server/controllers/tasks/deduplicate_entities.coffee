__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
entities_ = __.require 'controllers', 'entities/lib/entities'
tasks_ = __.require 'controllers', 'tasks/lib/tasks'

getEntitiesByUris = __.require 'controllers', 'entities/lib/get_entities_by_uris'
checkEntities = __.require 'controllers', 'tasks/lib/check_entities'

claim = [ 'wdt:P31', 'wd:Q5' ]

module.exports = (req, res)->
  offset = 0
  checkEntitiesRecursively claim, offset
  .then _.Ok(res)
  .catch error_.Handler(req, res)

checkEntitiesRecursively = (claim, offset)->
  getEntitiesBatch claim, offset
  .then (entities)->
    if entities.length is 0 then return

    checkEntities entities
    .then tasks_.keepNewTasks
    # TODO: bulk create
    .map tasks_.create
    .delay 1000
    .then ->
      offset += 100
      checkEntitiesRecursively claim, offset

getEntitiesBatch = (claim, offset)->
  entities_.db.view 'entities', 'byClaim',
    key: claim
    include_docs: true
    skip: offset
    limit: 100
  .then (res)-> _.pluck res.rows, 'doc'
