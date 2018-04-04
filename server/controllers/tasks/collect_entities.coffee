__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
tasks_ = __.require 'controllers', 'tasks/lib/tasks'
entities_ = __.require 'controllers', 'entities/lib/entities'
checkEntities = __.require 'controllers', 'tasks/lib/check_entities'
{ mapDoc } = __.require 'lib', 'couch'

module.exports = (req, res)->
  offset = 0
  checkEntitiesRecursively offset
  .then _.Ok(res)
  .catch error_.Handler(req, res)

checkEntitiesRecursively = (offset)->
  getEntitiesBatch offset
  .then (entities)->
    if entities.length is 0 then return

    checkEntities entities
    .then tasks_.keepNewTasks
    # TODO: bulk create
    .map tasks_.create
    .delay 1000
    .then ->
      offset += 100
      checkEntitiesRecursively offset

humanClaim = [ 'wdt:P31', 'wd:Q5' ]

getEntitiesBatch = (offset)->
  entities_.db.view 'entities', 'byClaim',
    key: humanClaim
    include_docs: true
    skip: offset
    limit: 100
  .then mapDoc
