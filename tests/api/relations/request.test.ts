import 'should'
import { getUsersWithoutRelation } from '#fixtures/users'
import { assertRelation, action } from '#tests/api/utils/relations'

describe('relations:request', () => {
  it('should create a friend request', async () => {
    const { userA, userB } = await getUsersWithoutRelation()
    await assertRelation(userA, userB, 'none')
    await action('request', userA, userB)
    await assertRelation(userA, userB, 'userRequested')
  })

  it('should ignore duplicated requests', async () => {
    const { userA, userB } = await getUsersWithoutRelation()
    await assertRelation(userA, userB, 'none')
    await action('request', userA, userB)
    await assertRelation(userA, userB, 'userRequested')
    await action('request', userA, userB)
    await assertRelation(userA, userB, 'userRequested')
  })
})
