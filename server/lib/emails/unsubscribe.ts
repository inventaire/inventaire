import { autoRotatedKeys } from '#lib/auto_rotated_keys'
import { newError } from '#lib/error/error'
import { buildUrl } from '#lib/utils/url'
import type { NotificationKey } from '#models/attributes/user'
import { publicOrigin } from '#server/config'
import { buildBase64EncodedJson, parseBase64EncodedJson } from '#tests/api/utils/auth'
import type { AbsoluteUrl } from '#types/common'
import type { Email, UserId } from '#types/user'

const userEndpoint = `${publicOrigin}/api/user` as AbsoluteUrl

export function getEmailUnsubscribeUrl (email: Email, userId: UserId, notificationKey: NotificationKey) {
  return getUnsubscribeUrl({ user: userId, email, set: `notifications.${notificationKey}=false` })
}

export function getUnsubscribeUrl (payload: unknown) {
  const stringifiedPayload = buildBase64EncodedJson(payload)
  const signature = autoRotatedKeys.sign(stringifiedPayload)
  return buildUrl(userEndpoint, {
    action: 'unsubscribe',
    data: stringifiedPayload,
    sig: signature,
  })
}

export function getSignedPayload (payload: string, signature: string) {
  const verified = autoRotatedKeys.verify(payload, signature)
  if (verified) {
    return parseBase64EncodedJson(payload)
  } else {
    throw newError('signed payload verification failed', 400, { payload, signature })
  }
}
