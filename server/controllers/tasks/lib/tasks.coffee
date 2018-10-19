CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
Task = __.require 'models', 'task'

db = __.require('couch', 'base')('tasks')

module.exports = tasks_ =
  create: (taskDoc)->
    promises_.try -> Task.create taskDoc
    .then db.postAndReturn
    .then _.Log('task created')

  update: (options)->
    { ids, attribute, newValue } = options
    tasks_.byIds ids
    .map (task)-> Task.update task, attribute, newValue
    .then db.bulk
    .then _.Log('tasks updated')

  byId: db.get

  byIds: db.fetch

  byScore: (options)->
    { limit, offset } = options
    db.viewCustom 'byScore',
      limit: limit
      skip: offset
      descending: true
      include_docs: true

  bySuspectUri: (suspectUri)->
    db.viewByKey 'bySuspectUri', suspectUri

  bySuspectUris: (suspectUris)->
    db.viewByKeys 'bySuspectUri', suspectUris

  bySuggestionUris: (suggestionUris)->
    db.viewByKeys 'bySuggestionUri', suggestionUris
