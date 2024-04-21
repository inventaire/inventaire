import validateObject from '#lib/validate_object'
import { controllerWrapper, validateControllerWrapperParams } from './controller_wrapper.js'
import { bundleMissingQueryError, bundleUnknownAction } from './error/pre_filled.js'
import { rolesByAccess } from './user_access_levels.js'

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

export default controllers => {
  const actionsControllersParams = getActionsControllersParams(controllers)
  return async (req, res) => {
    // Accepting the action to be passed either as a query string
    // or as a body parameter for more flexibility
    const action = req.query.action || req.body.action || 'default'

    if (action === 'default' && !('default' in actionsControllersParams)) {
      return bundleMissingQueryError(req, res, 'action')
    }

    const controllerParams = actionsControllersParams[action]
    if (controllerParams == null) return bundleUnknownAction(req, res)

    return controllerWrapper(controllerParams, req, res)
  }
}

const accessLevels = Object.keys(rolesByAccess)

function getActionsControllersParams (controllers) {
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

function getActionControllerParams (access, actionData) {
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
