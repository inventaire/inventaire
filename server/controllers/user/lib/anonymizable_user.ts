import { get, pick } from 'lodash-es'
import { dbFactory } from '#db/couchdb/base'
import { getRandomUuid } from '#lib/crypto'
import type { AnonymizableUserId, User, UserId } from '#types/user'
import type { SetRequired } from 'type-fest'

const db = await dbFactory('users')

export async function getUserAnonymizableId (user: User) {
  if ('anonymizableId' in user) return user.anonymizableId
  const anonymizableId = getRandomUuid()
  await db.update(user._id, (doc: User) => {
    doc.anonymizableId = anonymizableId
    return doc
  })
  return anonymizableId
}

export type UserWithAnonymizedId = SetRequired<User, 'anonymizableId'>
export async function getUsersByAnonymizedIds (anonymizableIds: AnonymizableUserId[]) {
  return db.getDocsByViewKeys<UserWithAnonymizedId>('byAnonymizableId', anonymizableIds)
}

const deanonymizedAttributes = [ 'username', 'bio', 'picture', 'created' ] as const
type DeanonymizedAttribute = typeof deanonymizedAttributes[number]

export interface AnonymizedUser {
  _id: AnonymizableUserId
  settings: {
    contributions: {
      anonymize: true
    }
  }
}

export interface DeanonymizedUser extends Pick<User, DeanonymizedAttribute> {
  _id: AnonymizableUserId
  publicId: UserId
  settings: {
    contributions: {
      anonymize: false
    }
  }
}

export function anonymizeUser (user: UserWithAnonymizedId) {
  const anonymizeSetting = get(user, 'settings.contributions.anonymize', true)
  if (anonymizeSetting) {
    return buildAnonymizedUser(user.anonymizableId)
  } else {
    return {
      _id: user.anonymizableId,
      publicId: user._id,
      settings: {
        contributions: {
          anonymize: false,
        },
      },
      ...pick(user, deanonymizedAttributes),
    } as DeanonymizedUser
  }
}

export function buildAnonymizedUser (anonymizableId: UserId) {
  return {
    _id: anonymizableId,
    settings: {
      contributions: {
        anonymize: true,
      },
    },
  } as AnonymizedUser
}
