
const __ = require('config').universalPath
const error_ = __.require('lib', 'error/error')
const validateObject = __.require('lib', 'validate_object')

module.exports = controllers => {
  const actions = getActions(controllers)
  return (req, res) => {
    // Accepting the action to be passed either as a query string
    // or as a body parameter for more flexibility
    const action = req.query.action || req.body.action

    if ((action == null) && (actions.default == null)) {
      return error_.bundleMissingQuery(req, res, 'action')
    }

    const actionData = (action != null) ? actions[action] : actions.default
    if (actionData == null) {
      return error_.unknownAction(req, res)
    }

    if (actionData.authentified && (req.user == null)) {
      return error_.unauthorizedApiAccess(req, res)
    }

    if (actionData.admin && !req.user.admin) {
      return error_.unauthorizedAdminApiAccess(req, res)
    }

    actionData.controller(req, res)
  }
}

const getActions = controllers => {
  let controller, key
  validateObject(controllers, [ 'public', 'authentified', 'admin' ], 'object')

  const { authentified, public: publik, admin } = controllers

  const actions = {}

  if (publik != null) {
    for (key in publik) {
      controller = publik[key]
      actions[key] = { controller, authentified: false, admin: false }
    }
  }

  if (authentified != null) {
    for (key in authentified) {
      controller = authentified[key]
      actions[key] = { controller, authentified: true, admin: false }
    }
  }

  if (admin != null) {
    for (key in admin) {
      controller = admin[key]
      actions[key] = { controller, authentified: true, admin: true }
    }
  }

  return actions
}
