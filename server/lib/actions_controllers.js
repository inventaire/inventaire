const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const validateObject = __.require('lib', 'validate_object')
const { rolesByAccess } = require('./get_user_access_levels')

module.exports = controllers => {
  const actions = getActions(controllers)
  return (req, res) => {
    // Accepting the action to be passed either as a query string
    // or as a body parameter for more flexibility
    const action = req.query.action || req.body.action

    if (action == null && actions.default == null) {
      return error_.bundleMissingQuery(req, res, 'action')
    }

    const actionData = action ? actions[action] : actions.default
    if (actionData == null) {
      return error_.unknownAction(req, res)
    }

    // user.roles doesn't contain 'public' and 'authentified', but those are needed to resolve access levels
    let roles = [ 'public' ]
    if (req.user) {
      roles.push('authentified')
      if (req.user.roles) roles = roles.concat(req.user.roles)
    }

    if (_.someMatch(roles, actionData.access)) actionData.controller(req, res)
    else error_.unauthorizedApiAccess(req, res, { roles, requiredAccessLevel: actionData.access })
  }
}

const accessLevels = Object.keys(rolesByAccess)

const getActions = controllers => {
  validateObject(controllers, accessLevels, 'object')

  const controllerKeys = Object.keys(controllers)
  const actions = {}

  controllerKeys.forEach(access => {
    for (const action in controllers[access]) {
      actions[action] = {
        controller: controllers[access][action],
        access: rolesByAccess[access]
      }
    }
  })

  return actions
}
