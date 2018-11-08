CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
{ createHuman } = require './entities'
{ checkEntities } = require '../utils/tasks'

promises = {}

module.exports = API =
  createSomeTasks: (humanLabel)->
    if promises[humanLabel]? then return promises[humanLabel]

    promises[humanLabel] = Promise.all [
        createHuman { labels: { en: humanLabel } }
        createHuman { labels: { en: humanLabel } }
      ]
      .then (humans)->
        checkEntities _.map(humans, 'uri')
        .then (tasks)-> { tasks, humans }

    return promises[humanLabel]
