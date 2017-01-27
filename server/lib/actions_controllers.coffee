__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'

module.exports = (actions)-> (req, res)->
  # Accepting the action to be passed either as a query string
  # or as a body parameter for more flexibility
  action = req.query.action or req.body.action

  if action?
    controller = actions[action] or error_.unknownAction
  else
    if actions.default? then controller = actions.default
    else return error_.bundle req, res, 'missing action parameter', 400, req.query

  controller req, res

  return
