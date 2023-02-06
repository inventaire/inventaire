import { getNotificationsByUserId } from '#controllers/notifications/lib/notifications'

const sanitization = {
  limit: { optional: true, default: 10 },
  offset: { optional: true },
}

const controller = params => {
  return getNotificationsByUserId(params.reqUserId)
  .then(paginate(params))
}

const paginate = params => notifications => {
  let { limit, offset } = params
  const total = notifications.length
  if (offset == null) offset = 0
  const last = offset + limit

  if (limit != null) {
    notifications = notifications.slice(offset, last)
    const data = { notifications, total, offset }
    if (last < total) data.continue = last
    return data
  } else {
    return { notifications, total, offset }
  }
}

export default { sanitization, controller }
