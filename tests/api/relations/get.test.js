import 'should'
import { addMember, getSomeGroupWithAMember } from '#fixtures/groups'
import { createUser } from '#fixtures/users'
import { makeFriendRequest, makeFriends } from '#tests/api/utils/relations'
import { customAuthReq } from '#tests/api/utils/request'

const endpoint = '/api/relations'

describe('relations:get', () => {
  it('should return user relations data', async () => {
    const [ reqUser, friend, requestedUser, requestingUser, { group, member: groupCoMember } ] = await Promise.all([
      createUser(),
      createUser(),
      createUser(),
      createUser(),
      getSomeGroupWithAMember(),
    ])
    await Promise.all([
      makeFriends(reqUser, friend),
      makeFriendRequest(reqUser, requestedUser),
      makeFriendRequest(requestingUser, reqUser),
      await addMember(group, reqUser),
    ])
    const res = await customAuthReq(reqUser, 'get', endpoint)
    res.friends.should.be.an.Array()
    res.otherRequested.should.be.an.Array()
    res.userRequested.should.be.an.Array()
    res.network.should.be.an.Array()
    res.friends.should.containEql(friend._id)
    res.userRequested.should.containEql(requestedUser._id)
    res.otherRequested.should.containEql(requestingUser._id)
    res.network.should.containEql(friend._id)
    res.network.should.containEql(groupCoMember._id)
  })
})
