__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'

module.exports = (actions)-> (req, res)->
  { action } = req.query

  unless action?
    return error_.bundle req, res, 'missing action parameter', 400

  controller = actions[action] or actions.default or error_.unknownAction
  controller req, res

  return
