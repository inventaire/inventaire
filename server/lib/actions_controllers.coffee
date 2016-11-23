__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'

module.exports = (actions)-> (req, res)->
  { action } = req.query

  if action?
    controller = actions[action] or error_.unknownAction
  else
    if actions.default? then controller = actions.default
    else return error_.bundle req, res, 'missing action parameter', 400

  controller req, res

  return
