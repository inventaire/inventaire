import assert from 'node:assert'
import { joinOrderedIds } from '#lib/couch'
import { assert_ } from '#lib/utils/assert_types'
import commonValidations from './validations/common.js'

const { userId } = commonValidations

export default {
  create: (id, status) => {
    assertValidId(id)
    assertValidStatus(status)
    return {
      _id: id,
      type: 'relation',
      status,
      created: Date.now(),
    }
  },

  docId: (userId, otherId) => {
    // TODO: add a receiver-read flag to stop notifying already read requestes
    return joinOrderedIds(userId, otherId)
  },
}

const assertValidId = id => {
  const [ userA, userB ] = id.split(':')
  assert(userA !== userB)
  assert_.string(userA)
  assert(userId(userA))
  return assert(userId(userB))
}

const assertValidStatus = status => assert(statuses.includes(status))

const statuses = [
  'friends',
  'a-requested',
  'b-requested',
  'none',
]
