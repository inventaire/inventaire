import { pick } from 'lodash-es'
import { getUserAccessLevels, type rolesByAccess } from '#lib/user_access_levels'
import userAttributes from '#models/attributes/user'
import type { DeletedUser, DocWithUsernameInUserDb, User, UserId } from '#types/user'

export interface OwnerSafeUser extends Pick<User, typeof userAttributes['ownerSafe'][number]> {
  oauth?: string[]
  accessLevels: typeof rolesByAccess['public'][number]
}

// Including the deleted user, as after deleting, it is still possible to make a request
// with the session cookies
export function ownerSafeData (user: User | DeletedUser) {
  if (user.type === 'deletedUser') return user
  const safeUserDoc: OwnerSafeUser = {
    ...pick(user, userAttributes.ownerSafe),
    accessLevels: getUserAccessLevels(user),
  }
  safeUserDoc.oauth = ('oauth' in user && user.oauth != null) ? Object.keys(user.oauth) : []
  safeUserDoc.roles = safeUserDoc.roles || []
  safeUserDoc.settings = safeUserDoc.settings || {}
  safeUserDoc.settings.notifications = safeUserDoc.settings.notifications || {}
  return safeUserDoc as OwnerSafeUser
}

// Adapts the result to the requester authorization level
export type UserExtraAttribute = 'email' | 'reports'

export function omitPrivateData (reqUserId?: UserId, networkIds: UserId[] = [], extraAttribute?: UserExtraAttribute) {
  const attributes = getAttributes(extraAttribute)
  return (userDoc: DocWithUsernameInUserDb) => {
    if (userDoc.type === 'deletedUser') return userDoc

    const userId = userDoc._id
    if (userId === reqUserId) return ownerSafeData(userDoc)

    const formatttedUserDoc = pick(userDoc, attributes)
    if ('snapshot' in formatttedUserDoc) {
      if ('private' in formatttedUserDoc.snapshot) delete formatttedUserDoc.snapshot.private
    }

    if (networkIds.includes(userId)) {
      return formatttedUserDoc
    } else {
      if ('snapshot' in formatttedUserDoc && 'network' in formatttedUserDoc.snapshot) {
        delete formatttedUserDoc.snapshot.network
      }
      return formatttedUserDoc
    }
  }
}

function getAttributes (extraAttribute?: UserExtraAttribute) {
  if (extraAttribute) {
    return [ ...userAttributes.public, extraAttribute ]
  } else {
    return userAttributes.public
  }
}
