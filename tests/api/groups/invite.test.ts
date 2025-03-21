import 'should'
import { createGroup, addMember, createGroupWithAMember, addRequested } from '#fixtures/groups'
import { createUser } from '#fixtures/users'
import { getGroup } from '#tests/api/utils/groups'
import { customAuthReq } from '#tests/api/utils/request'
import { authReq, authReqB, getUserB } from '#tests/api/utils/utils'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'

const endpoint = '/api/groups?action=invite'

describe('groups:update:invite', () => {
  it('should reject without a group', async () => {
    authReq('put', endpoint, {})
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: group')
      err.statusCode.should.equal(400)
    })
  })

  it('should reject without an existing user', async () => {
    const group = await createGroup()
    await authReq('put', endpoint, { user: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', group: group._id })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(404)
      err.body.status_verbose.should.equal('user not found')
    })
  })

  it('should add an invited when invitor is admin', async () => {
    const [ group, user ] = await Promise.all([ createGroup(), createUser() ])
    const invitedCount = group.invited.length
    await authReq('put', endpoint, { user: user._id, group: group._id })
    const updatedGroup = await getGroup(group)
    updatedGroup.invited.length.should.equal(invitedCount + 1)
  })

  it('should add an invited when invitor is member', async () => {
    const [ group, user ] = await Promise.all([ createGroup(), createUser() ])
    const userB = await getUserB()
    await addMember(group, userB)
    await authReqB('put', endpoint, { user: user._id, group: group._id })
    const updatedGroup = await getGroup(group)
    updatedGroup.invited.length.should.equal(1)
  })

  it('should add a member when the invited had requested to join', async () => {
    const { group, member } = await createGroupWithAMember()
    const user = await createUser()
    await addRequested(group, user)
    await customAuthReq(member, 'put', endpoint, { user: user._id, group: group._id })
    const updatedGroup = await getGroup(group)
    updatedGroup.members.at(-1).user.should.equal(user._id)
  })

  it('reject if invitor is not group member', async () => {
    const [ group, user ] = await Promise.all([ createGroup(), createUser() ])
    await authReqB('put', endpoint, { user: user._id, group: group._id })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal("invitor isn't in group")
      err.statusCode.should.equal(403)
    })
  })
})
