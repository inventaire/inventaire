import 'should'
import { getUsersWithoutRelation } from '../fixtures/users.js'
import { action, assertRelation } from '../utils/relations.js'

describe('relations:discard', () => {
  it('should discard a friend request', async () => {
    const { userA, userB } = await getUsersWithoutRelation()
    await action('request', userA, userB)
    await assertRelation(userA, userB, 'userRequested')
    await action('discard', userB, userA)
    await assertRelation(userA, userB, 'none')
  })

  it('should not allow to self-discard a friend request', async () => {
    const { userA, userB } = await getUsersWithoutRelation()
    await assertRelation(userA, userB, 'none')
    await action('request', userA, userB)
    // In the current implementation, it simply ignores the request
    // so there is no error being thrown
    await action('discard', userA, userB)
    await assertRelation(userA, userB, 'userRequested')
  })

  it('should ignore duplicated discard requests', async () => {
    const { userA, userB } = await getUsersWithoutRelation()
    await action('request', userA, userB)
    await action('discard', userB, userA)
    await action('discard', userB, userA)
  })
})
