import 'should'
import { getUsersWithoutRelation } from '../fixtures/users.js'
import { action, assertRelation } from '../utils/relations.js'

describe('relations:unfriend', () => {
  it('should unfriend a friend request', async () => {
    const { userA, userB } = await getUsersWithoutRelation()
    await action('request', userA, userB)
    await action('accept', userB, userA)
    await action('unfriend', userA, userB)
    await assertRelation(userA, userB, 'none')
  })

  it('should ignore duplicated unfriend requests', async () => {
    const { userA, userB } = await getUsersWithoutRelation()
    await action('request', userA, userB)
    await action('accept', userB, userA)
    await action('unfriend', userA, userB)
    await action('unfriend', userA, userB)
    await assertRelation(userA, userB, 'none')
  })
})
