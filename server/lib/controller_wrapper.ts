import { isAuthentifiedReq } from '#lib/boolean_validations'
import { errorHandler } from '#lib/error/error_handler'
import { remoteUserHeader, geRemoteUserFromSignedReqHeader } from '#lib/federation/remote_user'
import { someMatch } from '#lib/utils/base'
import type { SanitizedControllerFunction, StandaloneControllerFunction } from '#types/controllers'
import type { ControllerInputSanitization } from '#types/controllers_input_sanitization'
import type { Req, Res } from '#types/server'
import { newUnauthorizedApiAccessError } from './error/pre_filled.js'
import { send } from './responses.js'
import { sanitize, validateSanitization } from './sanitize/sanitize.js'
import { track } from './track.js'
import { rolesByAccess, type AccessLevel } from './user_access_levels.js'

interface SanitizedControllerParams {
  access: AccessLevel
  controller: SanitizedControllerFunction
  sanitization: ControllerInputSanitization
  track?: string[]
}

interface NonSanitizedControllerParams {
  access: AccessLevel
  controller: StandaloneControllerFunction
  sanitization: never
  track?: string[]
}

type ControllerParams = SanitizedControllerParams | NonSanitizedControllerParams

// A function to do the basic operations most controllers will need:
// - check access rights
// - sanitize input
// - send data for valid response
// - handle errors
// - track actions
export async function controllerWrapper (controllerParams: ControllerParams, req: Req, res: Res) {
  try {
    const { access, controller, sanitization, track: trackActionArray } = controllerParams
    // user.roles doesn't contain 'public' and 'authentified', but those are needed to resolve access levels
    const roles = [ 'public' ]
    if ('user' in req) {
      roles.push('authentified')
      if (req.user.roles) roles.push(...req.user.roles)
    } else if ('signature' in req.headers && remoteUserHeader in req.headers) {
      // @ts-expect-error
      req.remoteUser = await geRemoteUserFromSignedReqHeader(req)
      roles.push('authentified')
    }

    if (!someMatch(roles, rolesByAccess[access])) {
      const statusCode = isAuthentifiedReq(req) ? 403 : 401
      throw newUnauthorizedApiAccessError(statusCode, { roles, requiredAccessLevel: access })
    }

    if ('sanitization' in controllerParams && sanitization) {
      const params = sanitize(req, res, sanitization)
      const result = await (controller as SanitizedControllerFunction)(params, req, res)
      // If the controller doesn't return a result, assume that it handled the response itself
      // For example, with res.redirect
      if (result != null) send(res, result)
      if (trackActionArray) track(req, trackActionArray)
    } else {
      await (controller as StandaloneControllerFunction)(req, res)
    }
  } catch (err) {
    errorHandler(req, res, err)
  }
}

export function controllerWrapperFactory (controllerParams: ControllerParams) {
  validateControllerWrapperParams(controllerParams)
  return controllerWrapper.bind(null, controllerParams)
}

// Allow to validate parameters separately, so that
// consumers of controllerWrapper can run this validate only once
// when the server is starting (rather than for each request)
export function validateControllerWrapperParams (controllerParams: ControllerParams) {
  const { sanitization } = controllerParams
  if (sanitization) validateSanitization(sanitization)
}
