import { newError } from '#lib/error/error'

export default (user, notificationLabel) => {
  const { _id, type, settings, undeliveredEmail } = user

  if (type === 'deletedUser') throw emailDisabled({ user: _id, reason: 'deleted user' })

  if (!settings) throw newError('invalid user doc', user)

  if (undeliveredEmail > 1) {
    throw emailDisabled({ user: _id, reason: 'too many undelivered emails' })
  }

  const { notifications = {} } = settings
  checkSetting(_id, notifications, 'global')
  checkSetting(_id, notifications, notificationLabel)
}

const checkSetting = (userId, notifications, label) => {
  // settings might be undefined, defaulting to true (activated)
  if (notifications[label] === false) {
    throw emailDisabled({
      user: userId,
      notification: label,
    })
  }
}

const emailDisabled = context => newError('email disabled', 'email_disabled', context)
