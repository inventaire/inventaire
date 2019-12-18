require('should')
const { getUser, getReservedUser } = require('../utils/utils')
const { action, assertRelation } = require('../utils/relations')

describe('relations:accept', () => {
  it('should accept a friend request', async () => {
    const userA = await getUser()
    const userB = await getReservedUser()
    await action('request', userA, userB)
    await action('accept', userB, userA)
    await assertRelation(userA, userB, 'friends')
  })

  it('should not allow to self-accept a friend request', async () => {
    const userA = await getUser()
    const userB = await getReservedUser()
    await action('request', userA, userB)
    // In the current implementation, it simply ignores the request
    // so there is no error being thrown
    await action('accept', userA, userB)
    await assertRelation(userA, userB, 'userRequested')
  })

  it('should ignore duplicated accept requests', async () => {
    const userA = await getUser()
    const userB = await getReservedUser()
    await action('request', userA, userB)
    await action('accept', userB, userA)
    await action('accept', userB, userA)
    await assertRelation(userA, userB, 'friends')
  })
})
