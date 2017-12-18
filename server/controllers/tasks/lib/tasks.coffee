CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
task_ = __.require 'models', 'task'

db = __.require('couch', 'base')('tasks')

module.exports = tasks_ =
  deduplicates: (limit)->
    db.viewCustom 'deduplicates',
      limit: limit
      skip: 0
      descending: true
      include_docs: true

  create: (taskDoc)->
    promises_.try -> task_.create taskDoc
    .then db.postAndReturn
    .then _.Log('task created')

