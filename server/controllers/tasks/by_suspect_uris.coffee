__ = require('config').universalPath
_ = __.require 'builders', 'utils'
responses_ = __.require 'lib', 'responses'
error_ = __.require 'lib', 'error/error'
tasks_ = require './lib/tasks'
sanitize = __.require 'lib', 'sanitize/sanitize'

sanitization =
  uris: {}

module.exports = (req, res)->
  sanitize req, res, sanitization
  .then (params)->
    { uris } = params
    tasks_.bySuspectUris uris
    .then (tasks)->
      index = uris.reduce buildIndex, {}
      tasks.reduce regroupBySuspectUri, index
  .then responses_.Wrap(res, 'tasks')
  .catch error_.Handler(req, res)

buildIndex = (index, uri)->
  index[uri] = []
  return index

regroupBySuspectUri = (tasks, task)->
  { suspectUri } = task
  tasks[suspectUri].push task
  return tasks
