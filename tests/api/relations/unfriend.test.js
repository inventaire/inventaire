require('should')
const { getUser, getReservedUser } = require('../utils/utils')
const { action, assertRelation } = require('../utils/relations')

describe('relations:unfriend', () => {
  it('should unfriend a friend request', async () => {
    const userA = await getUser()
    const userB = await getReservedUser()
    await action('request', userA, userB)
    await action('accept', userB, userA)
    await action('unfriend', userA, userB)
    await assertRelation(userA, userB, 'none')
  })

  it('should ignore duplicated unfriend requests', async () => {
    const userA = await getUser()
    const userB = await getReservedUser()
    await action('request', userA, userB)
    await action('accept', userB, userA)
    await action('unfriend', userA, userB)
    await action('unfriend', userA, userB)
    await assertRelation(userA, userB, 'none')
  })
})
