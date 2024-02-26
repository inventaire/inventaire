import { error_ } from '#lib/error/error'
import { someMatch } from '#lib/utils/base'
import validateObject from '#lib/validate_object'
import { send } from './responses.js'
import { sanitize, validateSanitization } from './sanitize/sanitize.js'
import { track } from './track.js'
import { rolesByAccess } from './user_access_levels.js'
import { assert_ } from './utils/assert_types.js'

// A function to do the basic operations most controllers will need:
// - check access rights
// - sanitize input
// - send data for valid response
// - handle errors
// - track actions
export async function controllerWrapper (controllerParams, req, res) {
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

export const ControllerWrapper = controllerParams => {
  validateControllerWrapperParams(controllerParams)
  return controllerWrapper.bind(null, controllerParams)
}

// Allow to validate parameters separately, so that
// consumers of controllerWrapper can run this validate only once
// when the server is starting (rather than for each request)
export const validateControllerWrapperParams = controllerParams => {
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
