__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
validateObject = __.require 'lib', 'validate_object'

module.exports = (controllers)->
  actions = getActions controllers
  return (req, res)->
    # Accepting the action to be passed either as a query string
    # or as a body parameter for more flexibility
    action = req.query.action or req.body.action

    if not action? and not actions.default?
      return error_.bundleMissingQuery req, res, 'action'

    actionData = if action? then actions[action] else actions.default
    unless actionData?
      return error_.unknownAction req, res

    if actionData.authentified and not req.user?
      return error_.unauthorizedApiAccess req, res

    if actionData.admin and not req.user.admin
      return error_.unauthorizedAdminApiAccess req, res

    actionData.controller req, res

    return

getActions = (controllers)->
  validateObject controllers, [ 'public', 'authentified', 'admin' ], 'object'

  { authentified, public:publik, admin } = controllers

  actions = {}

  if publik?
    for key, controller of publik
      actions[key] = { controller, authentified: false, admin: false }

  if authentified?
    for key, controller of authentified
      actions[key] = { controller, authentified: true, admin: false }

  if admin?
    for key, controller of admin
      actions[key] = { controller, authentified: true, admin: true }

  return actions
