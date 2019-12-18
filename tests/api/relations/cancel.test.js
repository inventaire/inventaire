require('should')
const { getUser, getReservedUser } = require('../utils/utils')
const { assertRelation, action } = require('../utils/relations')

describe('relations:cancel', () => {
  it('should cancel a friend request', async () => {
    const userA = await getUser()
    const userB = await getReservedUser()
    await action('request', userA, userB)
    await action('cancel', userA, userB)
    await assertRelation(userA, userB, 'none')
  })

  it('should ignore duplicated cancel requests', async () => {
    const userA = await getUser()
    const userB = await getReservedUser()
    await action('request', userA, userB)
    await action('cancel', userA, userB)
    await action('cancel', userA, userB)
    await assertRelation(userA, userB, 'none')
  })
})
