import assert from 'node:assert'
import { assert_ } from '#lib/utils/assert_types'
import { arrayIncludes } from '#lib/utils/base'
import type { RelationId, RelationStatus } from '#types/relation'
import type { UserId } from '#types/user'
import commonValidations from './validations/common.js'

const { userId } = commonValidations

export function createRelationDoc (id: RelationId, status: RelationStatus) {
  assertValidId(id)
  assertValidStatus(status)
  return {
    _id: id,
    type: 'relation' as const,
    status,
    created: Date.now(),
  }
}

export function getRelationDocId (userId: UserId, otherId: UserId) {
  // TODO: add a receiver-read flag to stop notifying already read requestes
  return joinOrderedIds(userId, otherId)
}

function assertValidId (id: string): asserts id is RelationId {
  const [ userA, userB ] = id.split(':')
  assert(userA !== userB)
  assert_.string(userA)
  assert(userId(userA))
  assert(userId(userB))
}

function assertValidStatus (status: string): asserts status is RelationStatus {
  assert(arrayIncludes(statuses, status))
}

export const statuses = [
  'friends',
  'a-requested',
  'b-requested',
  'none',
] as const

export function joinOrderedIds (idA: UserId, idB: UserId): RelationId {
  if (idA < idB) return `${idA}:${idB}`
  else return `${idB}:${idA}`
}
