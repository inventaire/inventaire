import 'should'
import { assertRelation, action } from '../utils/relations'
import { getUsersWithoutRelation } from '../fixtures/users'

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
