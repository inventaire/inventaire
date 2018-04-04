__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
tasks_ = require './lib/tasks'

module.exports = (req, res)->
  { uri } = req.query

  unless _.isEntityUri uri
    return error_.bundleInvalid req, res, 'suspectUri', uri

  tasks_.bySuspectUri uri
  .then _.Wrap(res, 'tasks')
  .catch error_.Handler(req, res)
