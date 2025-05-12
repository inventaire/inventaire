import { isAuthentifiedReq, isRelativeUrl } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { newUnauthorizedApiAccessError } from '#lib/error/pre_filled'
import { federatedRequest } from '#lib/federation/federated_requests'
import { runPostProxiedRequestHooks } from '#lib/federation/proxied_requests_hooks'
import { signedFederatedRequest } from '#lib/federation/signed_federated_request'
import { httpMethodHasBody } from '#lib/requests'
import type { AccessLevel } from '#lib/user_access_levels'
import { logError, warn } from '#lib/utils/logs'
import { remoteEntitiesOrigin } from '#server/config'
import type { AbsoluteUrl, RelativeUrl, HttpMethod } from '#types/common'
import type { ActionController, SanitizedControllerFunction, StandaloneControllerFunction } from '#types/controllers'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { AuthentifiedReq, Req, Res } from '#types/server'

export function proxiedController (accessLevel: AccessLevel, method: HttpMethod, pathname: RelativeUrl, action: string, actionController: ActionController) {
  if (accessLevel === 'admin' || accessLevel === 'dataadmin') return closedEndpointFactory(method, pathname, action)
  let sanitization, track
  if (typeof actionController !== 'function') {
    ;({ sanitization, track } = actionController)
  }

  const controller = proxiedControllerFunctionFactory(accessLevel, method, pathname, action, actionController)

  if (typeof actionController === 'function') {
    return controller
  } else {
    // Sanitize locally before proxying
    return { controller, sanitization, track }
  }
}

function proxiedControllerFunctionFactory (accessLevel: AccessLevel, method: HttpMethod, pathname: RelativeUrl, action: string, actionController: ActionController) {
  if (typeof actionController === 'function') {
    return async function controller (req: Req, res: Res) {
      if (accessLevel === 'public') {
        if (shouldBeRedirected(method, pathname, action, req.query)) {
          const remoteUrl = `${remoteEntitiesOrigin}${req.url}` as AbsoluteUrl
          // Redirecting is a simple way to support the different types or responses that an endpoint such as /api/entities?action=images might return
          // Alternatively, a `fetch` request could be piped to `res`
          // See https://stackoverflow.com/a/77589444
          res.redirect(remoteUrl)
        } else {
          return proxyPublicJsonRequest(req, res, method, action)
        }
      } else {
        throw newError('non-public controllers can not be redirected', 500, { url: req.url, accessLevel, method, action })
      }
    } as StandaloneControllerFunction
  } else {
    return async function controller (params: SanitizedParameters, req: Req | AuthentifiedReq) {
      return proxyWrappedController(req, accessLevel, method, action, params)
    } as SanitizedControllerFunction
  }
}

// Current use-case: /api/entities?action=images
async function proxyPublicJsonRequest (req: Req, res: Res, method: HttpMethod, action: string) {
  const { url } = req
  if (!isRelativeUrl(url)) throw newError('invalid relative url', 500, { method, action })
  const body = httpMethodHasBody(method) ? req.body : undefined
  const headers = getProxiedHeaders(req)
  const remoteRes = await federatedRequest(method, url, { body, headers })
  // Commenting out as current use-cases don't need runPostProxiedRequestHooks
  // and passing req.query triggers a type error
  // runPostProxiedRequestHooks(method, url, action, req.query)
  return res.json(remoteRes)
}

function shouldBeRedirected (method: HttpMethod, pathname: RelativeUrl, action: string, query?: { redirect?: boolean }) {
  return method === 'get' && pathname === '/api/entities' && action === 'images' && query.redirect
}

// "Wrapped", because it does not handle the http response (aka `Res`)
async function proxyWrappedController (req: Req | AuthentifiedReq, accessLevel: AccessLevel, method: HttpMethod, action: string, params?: SanitizedParameters, attempts?: number) {
  attempts ??= 0
  const { url } = req
  if (!isRelativeUrl(url)) throw newError('invalid relative url', 500, { method, action, params })
  const body = httpMethodHasBody(method) ? req.body : undefined
  const headers = getProxiedHeaders(req)
  let res
  if (accessLevel === 'public' || (accessLevel === 'semipublic' && !isAuthentifiedReq(req))) {
    res = await federatedRequest(method, url, { body, headers })
  } else if (isAuthentifiedReq(req)) {
    res = await signedFederatedRequest(req, method, url, body, headers)
  } else {
    throw newUnauthorizedApiAccessError(401)
  }
  try {
    await runPostProxiedRequestHooks(method, url, action, params, res)
  } catch (err) {
    if (err.retryProxiedRequest && attempts < 3) {
      warn({ url, error: err.message, context: err.context, attempts }, 'retrying proxied request')
      return proxyWrappedController(req, accessLevel, method, action, params, attempts + 1)
    } else {
      logError(err, 'runPostProxiedRequestHooks error')
    }
  }
  return res
}

function closedEndpointFactory (method: HttpMethod, pathname: RelativeUrl, action: string) {
  return function closedEndpointController () {
    throw newError('This endpoint is closed in federated mode', 400, { endpoint: `${method.toUpperCase()} ${pathname}?action=${action}` })
  }
}

function getProxiedHeaders (req: Req) {
  // If an etag is sent by the user browser, pass it to the federated request, so that if the response was not modified,
  // we can save the body transfer from the remote entities origin to the federated server
  // ETags are set by the express server via the etag package, see https://expressjs.com/fr/api.html#etag.options.table
  const etag = req.get('if-none-match')
  if (etag) return { 'if-none-match': etag }
}
