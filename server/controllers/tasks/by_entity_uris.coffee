__ = require('config').universalPath
_ = __.require 'builders', 'utils'
responses_ = __.require 'lib', 'responses'
error_ = __.require 'lib', 'error/error'
tasks_ = require './lib/tasks'
sanitize = __.require 'lib', 'sanitize/sanitize'

sanitization =
  uris: {}

byEntityUris = (fnName)-> (req, res)->
  sanitize req, res, sanitization
  .get 'uris'
  .then (uris)-> tasks_[fnName](uris, true)
  .then responses_.Wrap(res, 'tasks')
  .catch error_.Handler(req, res)

module.exports =
  bySuspectUris: byEntityUris 'bySuspectUris'
  bySuggestionUris: byEntityUris 'bySuggestionUris'
