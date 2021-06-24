const { someMatch } = require('builders/utils')
const error_ = require('lib/error/error')
const validateObject = require('lib/validate_object')
const { rolesByAccess } = require('./user_access_levels')
const { send } = require('./responses')
const { sanitize } = require('./sanitize/sanitize')
const { track } = require('./track')
const assert_ = require('./utils/assert_types')

module.exports = controllers => {
  const actions = getActions(controllers)
  return async (req, res) => {
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

    if (!someMatch(roles, actionData.access)) {
      return error_.unauthorizedApiAccess(req, res, { roles, requiredAccessLevel: actionData.access })
    }

    const { controller, sanitization, trackActionArray } = actionData
    try {
      if (sanitization) {
        const params = sanitize(req, res, sanitization)
        const result = await controller(params, req, res)
        send(res, result)
        if (trackActionArray) track(req, trackActionArray)
      } else {
        await controller(req, res)
      }
    } catch (err) {
      error_.handler(req, res, err)
    }
  }
}

const accessLevels = Object.keys(rolesByAccess)

const getActions = controllers => {
  validateObject(controllers, accessLevels, 'object')

  const controllerKeys = Object.keys(controllers)
  const actions = {}

  controllerKeys.forEach(access => {
    for (const action in controllers[access]) {
      const controllerData = controllers[access][action]
      actions[action] = getActionData(access, controllerData)
    }
  })

  return actions
}

const getActionData = (access, controllerData) => {
  let controller, sanitization, trackActionArray
  if (controllerData.sanitization) {
    ({ controller, sanitization, track: trackActionArray } = controllerData)
    assert_.object(sanitization)
    if (trackActionArray) assert_.array(trackActionArray)
  } else {
    controller = controllerData
  }
  assert_.function(controller)
  return {
    access: rolesByAccess[access],
    controller,
    sanitization,
    trackActionArray,
  }
}
