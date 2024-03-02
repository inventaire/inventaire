import { isString, pick } from 'lodash-es'
import { getUserAccessLevels, type rolesByAccess } from '#lib/user_access_levels'
import userAttributes from '#models/attributes/user'
import type { User, UserId } from '#types/user'

interface OwnerSafeUser extends Pick<User, typeof userAttributes['ownerSafe'][number]> {
  oauth?: string[]
  accessLevels: typeof rolesByAccess['public'][number]
}

export function ownerSafeData (user: User) {
  const safeUserDoc = pick(user, userAttributes.ownerSafe) as OwnerSafeUser
  if (user.type === 'deletedUser') return safeUserDoc
  safeUserDoc.oauth = user.oauth ? Object.keys(user.oauth) : []
  safeUserDoc.roles = safeUserDoc.roles || []
  safeUserDoc.accessLevels = getUserAccessLevels(user)
  safeUserDoc.settings = safeUserDoc.settings || {}
  safeUserDoc.settings.notifications = safeUserDoc.settings.notifications || {}
  return safeUserDoc
}

// Adapts the result to the requester authorization level
export const omitPrivateData = (reqUserId?: UserId, networkIds = [], extraAttribute?: string) => {
  const attributes = getAttributes(extraAttribute)
  return userDoc => {
    if (userDoc.type === 'deletedUser') return userDoc

    const userId = userDoc._id
    if (userId === reqUserId) return ownerSafeData(userDoc)

    userDoc = pick(userDoc, attributes)
    delete userDoc.snapshot.private

    if (networkIds.includes(userId)) return userDoc

    delete userDoc.snapshot.network
    return userDoc
  }
}

const getAttributes = extraAttribute => {
  const attributes = userAttributes.public
  // Making sure we are not dealing with a map index accidently
  // passed as second argument.
  // Returning a different object
  if (isString(extraAttribute)) {
    return [ extraAttribute ].concat(attributes)
  } else {
    return attributes
  }
}
