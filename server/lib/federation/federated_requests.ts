import { isRelativeUrl } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import type { ContextualizedError } from '#lib/error/format_error'
import { request, type RequestOptions } from '#lib/requests'
import { remoteEntitiesOrigin } from '#server/config'
import type { AbsoluteUrl, HttpMethod, Url } from '#types/common'

export async function federatedRequest <Response = unknown> (method: HttpMethod, url: Url, options: RequestOptions = {}) {
  const remoteUrl = isRelativeUrl(url) ? `${remoteEntitiesOrigin}${url}` as AbsoluteUrl : url
  try {
    const res = await request(method, remoteUrl, options)
    return res as Response
  } catch (err) {
    throw forwardRemoteError(err, remoteUrl)
  }
}

export function forwardRemoteError (err: ContextualizedError, remoteUrl: AbsoluteUrl) {
  if (!('body' in err)) throw err
  const { statusCode } = err
  // @ts-expect-error
  const { status_verbose: message, context } = err.body
  const repackedError = newError(message, statusCode, context)
  repackedError.forwardedFrom = remoteUrl
  return repackedError
}
