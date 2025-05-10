import { getNotificationsByUserId } from '#controllers/notifications/lib/notifications'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'

const sanitization = {
  limit: { optional: true, default: 10 },
  offset: { optional: true },
} as const

async function controller (params: SanitizedParameters) {
  const notifications = await getNotificationsByUserId(params.reqUserId)
  return paginate(notifications, params)
}

function paginate (notifications, params) {
  let { limit, offset } = params
  const total = notifications.length
  if (offset == null) offset = 0
  const last = offset + limit

  if (limit != null) {
    notifications = notifications.slice(offset, last)
    return {
      notifications,
      total,
      offset,
      continue: (last < total) ? last : undefined,
    }
  } else {
    return { notifications, total, offset }
  }
}

export default { sanitization, controller }
