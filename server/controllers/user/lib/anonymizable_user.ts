import { get, pick } from 'lodash-es'
import { dbFactory } from '#db/couchdb/base'
import type { AnonymizableUserId, User } from '#types/user'

const db = await dbFactory('users')

export async function getUsersByAnonymizedIds (anonymizableIds: AnonymizableUserId[]) {
  return db.getDocsByViewKeys<User>('byAnonymizableId', anonymizableIds)
}

const deanonymizedAttributes = [ 'username', 'bio', 'picture', 'created' ] as const
type DeanonymizedAttribute = typeof deanonymizedAttributes[number]

export interface AnonymizedUser {
  anonymizableId: AnonymizableUserId
  settings: {
    contributions: {
      anonymize: true
    }
  }
}

export interface DeanonymizedUser extends Pick<User, DeanonymizedAttribute> {
  anonymizableId: AnonymizableUserId
  settings: {
    contributions: {
      anonymize: false
    }
  }
}

export function anonymizeUser (user: User) {
  const anonymizeSetting = get(user, 'settings.contributions.anonymize', true)
  if (anonymizeSetting) {
    return buildAnonymizedUser(user.anonymizableId)
  } else {
    return {
      anonymizableId: user.anonymizableId,
      settings: {
        contributions: {
          anonymize: false,
        },
      },
      ...pick(user, deanonymizedAttributes),
    } as DeanonymizedUser
  }
}

export function buildAnonymizedUser (anonymizableId: AnonymizableUserId) {
  return {
    anonymizableId,
    settings: {
      contributions: {
        anonymize: true,
      },
    },
  } as AnonymizedUser
}