require('should')
const { assertRelation, action } = require('../utils/relations')
const { getUsersWithoutRelation } = require('../fixtures/users')

describe('relations:cancel', () => {
  it('should cancel a friend request', async () => {
    const { userA, userB } = await getUsersWithoutRelation()
    await action('request', userA, userB)
    await action('cancel', userA, userB)
    await assertRelation(userA, userB, 'none')
  })

  it('should ignore duplicated cancel requests', async () => {
    const { userA, userB } = await getUsersWithoutRelation()
    await action('request', userA, userB)
    await action('cancel', userA, userB)
    await action('cancel', userA, userB)
    await assertRelation(userA, userB, 'none')
  })
})
