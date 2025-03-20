import { isNumber } from 'lodash-es'
import { isArray } from '#lib/boolean_validations'
import { bundleInvalidError } from '#lib/error/pre_filled'
import { responses_ } from '#lib/responses'
import type { AuthentifiedReq, Res } from '#types/server'
import { updateNotificationReadStatus } from './lib/notifications.js'

export async function updateNotificationsStatus (req: AuthentifiedReq, res: Res) {
  const reqUserId = req.user._id

  const { times } = req.body
  if (!(isArray(times) && times.every(isNumber))) {
    return bundleInvalidError(req, res, 'times', times)
  }
  if (times.length === 0) return responses_.ok(res)

  // TODO: consider using doc ids rather than timestamps
  await updateNotificationReadStatus(reqUserId, times)
  return responses_.ok(res)
}
