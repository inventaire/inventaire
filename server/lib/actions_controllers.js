const error_ = require('lib/error/error')
const validateObject = require('lib/validate_object')
const { rolesByAccess } = require('./user_access_levels')
const { controllerWrapper, validateControllerWrapperParams } = require('./controller_wrapper')

// A function to route requests to an endpoint to sub-endpoints
// identified by their 'action' names:
//
// controllers = {
//   [accessLevel]: {
//     [actionA]: controller,
//     [actionB]: {
//       sanitization,
//       controller,
//       track,
//     },
//   }
// }

module.exports = controllers => {
  const actionsControllersParams = getActionsControllersParams(controllers)
  return async (req, res) => {
    // Accepting the action to be passed either as a query string
    // or as a body parameter for more flexibility
    let action = req.query.action || req.body.action

    if (action == null && actionsControllersParams.default == null) {
      return error_.bundleMissingQuery(req, res, 'action')
    }

    action = action || 'default'

    const controllerParams = actionsControllersParams[action]
    if (controllerParams == null) return error_.unknownAction(req, res)

    return controllerWrapper(controllerParams, req, res)
  }
}

const accessLevels = Object.keys(rolesByAccess)

const getActionsControllersParams = controllers => {
  validateObject(controllers, accessLevels, 'object')

  const controllerKeys = Object.keys(controllers)
  const actionsControllersParams = {}

  controllerKeys.forEach(access => {
    for (const action in controllers[access]) {
      const actionData = controllers[access][action]
      actionsControllersParams[action] = getActionControllerParams(access, actionData)
    }
  })

  return actionsControllersParams
}

const getActionControllerParams = (access, actionData) => {
  let controller, sanitization, track
  if (actionData.sanitization) {
    ({ controller, sanitization, track } = actionData)
  } else {
    controller = actionData
  }
  const controllerParams = { access, controller, sanitization, track }
  validateControllerWrapperParams(controllerParams)
  return controllerParams
}
