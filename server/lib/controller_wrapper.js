const { someMatch } = require('builders/utils')
const error_ = require('lib/error/error')
const validateObject = require('lib/validate_object')
const { rolesByAccess } = require('./user_access_levels')
const { send } = require('./responses')
const { sanitize, validateSanitization } = require('./sanitize/sanitize')
const { track } = require('./track')
const assert_ = require('./utils/assert_types')

// A function to do the basic operations most controllers will need:
// - check access rights
// - sanitize input
// - send data for valid response
// - handle errors
// - track actions
const controllerWrapper = async (controllerParams, req, res) => {
  const { access, controller, sanitization, track: trackActionArray } = controllerParams
  // user.roles doesn't contain 'public' and 'authentified', but those are needed to resolve access levels
  const roles = [ 'public' ]
  if (req.user) {
    roles.push('authentified')
    if (req.user.roles) roles.push(...req.user.roles)
  }

  if (!someMatch(roles, rolesByAccess[access])) {
    return error_.unauthorizedApiAccess(req, res, { roles, requiredAccessLevel: access })
  }

  try {
    if (sanitization) {
      const params = sanitize(req, res, sanitization)
      const result = await controller(params, req, res)
      // If the controller doesn't return a result, assume that it handled the response itself
      // For example, with res.redirect
      if (result != null) send(res, result)
      if (trackActionArray) track(req, trackActionArray)
    } else {
      await controller(req, res)
    }
  } catch (err) {
    error_.handler(req, res, err)
  }
}

const ControllerWrapper = controllerParams => {
  validateControllerWrapperParams(controllerParams)
  return controllerWrapper.bind(null, controllerParams)
}

// Allow to validate parameters separately, so that
// consumers of controllerWrapper can run this validate only once
// when the server is starting (rather than for each request)
const validateControllerWrapperParams = controllerParams => {
  validateObject(controllerParams, controllerParamsKeys)
  const { access, controller, sanitization, track: trackActionArray } = controllerParams
  assert_.string(access)
  assert_.array(rolesByAccess[access])
  assert_.function(controller)
  if (sanitization) {
    assert_.object(sanitization)
    validateSanitization(sanitization)
  }
  if (trackActionArray) assert_.array(trackActionArray)
}

const controllerParamsKeys = [
  'access',
  'controller',
  'sanitization',
  'track',
]

module.exports = {
  controllerWrapper,
  ControllerWrapper,
  validateControllerWrapperParams
}
