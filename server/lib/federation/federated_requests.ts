import { isString } from 'lodash-es'
import { isRelativeUrl } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import type { ContextualizedError } from '#lib/error/format_error'
import { request, type RequestOptions } from '#lib/requests'
import { remoteEntitiesOrigin } from '#server/config'
import type { AbsoluteUrl, HttpMethod, Url } from '#types/common'

export async function federatedRequest <Response = unknown> (method: HttpMethod, url: Url, options: RequestOptions = {}) {
  const remoteUrl = isRelativeUrl(url) ? `${remoteEntitiesOrigin}${url}` as AbsoluteUrl : url
  try {
    const { statusCode, body } = await request(method, remoteUrl, { parseJson: false, returnBodyOnly: false, ...options })
    if (statusCode === 304) {
      // Will be handled by server/lib/error/error_handler.ts
      throw newError('not modified', 304)
    } else {
      return JSON.parse(body) as Response
    }
  } catch (err) {
    throw forwardRemoteError(err, remoteUrl)
  }
}

export function forwardRemoteError (err: ContextualizedError, remoteUrl: AbsoluteUrl) {
  if (!('body' in err)) throw err
  const { statusCode } = err
  const body = isString(err.body) ? JSON.parse(err.body) : err.body
  const { status_verbose: message, context } = body
  const repackedError = newError(message, statusCode, context)
  repackedError.forwardedFrom = remoteUrl
  return repackedError
}
