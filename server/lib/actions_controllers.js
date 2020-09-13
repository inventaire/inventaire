const __ = require('config').universalPath
const error_ = __.require('lib', 'error/error')
const validateObject = __.require('lib', 'validate_object')

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

    if (actionData.access.includes('authentified') && (req.user == null)) {
      return error_.unauthorizedApiAccess(req, res)
    }

    if (isAccessible(req.user, actionData, 'dataadmin')) {
      return error_.unauthorizedDataadminApiAccess(req, res)
    }

    if (isAccessible(req.user, actionData, 'admin')) {
      return error_.unauthorizedAdminApiAccess(req, res)
    }

    actionData.controller(req, res)
  }
}

const dontHaveRole = (user, role) => { return !(hasRole(user, role)) }

const isAccessible = (user, actionData, role) => {
  return actionData.access.includes(role) && dontHaveRole(user, role)
}

const hasRole = (user, role) => { return user.roles && user.roles.includes(role) }

const getActions = controllers => {
  validateObject(controllers, [ 'public', 'authentified', 'admin', 'dataadmin' ], 'object')

  const rolesByAccess = {
    public: [ ],
    authentified: [ 'authentified' ],
    dataadmin: [ 'authentified', 'dataadmin' ],
    admin: [ 'authentified', 'admin' ]
  }

  const controllerKeys = Object.keys(controllers)
  const actions = {}

  controllerKeys.forEach(access => {
    for (const action in controllers[access]) {
      actions[action] = { controller: controllers[access][action], access: rolesByAccess[access] }
    }
  })

  return actions
}
