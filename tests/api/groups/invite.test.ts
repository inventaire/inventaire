import 'should'
import { createGroup, addMember } from '#fixtures/groups'
import { getGroup } from '#tests/api/utils/groups'
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

  it('should add an invited when invitor is admin', async () => {
    const group = await createGroup()
    const invitedCount = group.invited.length
    await authReq('put', endpoint, { user: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', group: group._id })
    const updatedGroup = await getGroup(group)
    updatedGroup.invited.length.should.equal(invitedCount + 1)
  })

  it('should add an invited when invitor is member', async () => {
    const group = await createGroup()
    const userB = await getUserB()
    await addMember(group, userB)
    await authReqB('put', endpoint, { user: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', group: group._id })
    const updatedGroup = await getGroup(group)
    updatedGroup.invited.length.should.equal(1)
  })

  it('reject if invitor is not group member', async () => {
    const group = await createGroup()
    await authReqB('put', endpoint, { user: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', group: group._id })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal("invitor isn't in group")
      err.statusCode.should.equal(403)
    })
  })
})
