import 'should'
import { getGroup, leaveGroup } from '#tests/api/utils/groups'
import { customAuthReq } from '#tests/api/utils/request'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'
import { createGroup, createGroupAndMember } from '../fixtures/groups.js'
import { authReq, authReqC, getUser } from '../utils/utils.js'

const endpoint = '/api/groups?action=leave'

let someReservedGroupPromise
const getGroupAndMember = () => {
  someReservedGroupPromise = someReservedGroupPromise || createGroupAndMember()
  return someReservedGroupPromise
}

describe('groups:update:leave', () => {
  it('should reject without group', async () => {
    await authReq('put', endpoint, { user: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: group')
      err.statusCode.should.equal(400)
    })
  })

  it('should reject leaving non group members', async () => {
    const { group } = await getGroupAndMember()
    await authReqC('put', endpoint, { group: group._id })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('user is not in the group')
      err.statusCode.should.equal(403)
    })
  })

  it('should reject last admin to leave', async () => {
    const { group } = await getGroupAndMember()
    await authReq('put', endpoint, { group: group._id })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith("the last group admin can't leave before naming another admin")
      err.statusCode.should.equal(403)
    })
  })

  it('should leave group', async () => {
    const { group, member } = await getGroupAndMember()
    const memberCount = group.members.length
    await customAuthReq(member, 'put', endpoint, { group: group._id })
    const updatedGroup = await getGroup(group)
    updatedGroup.members.length.should.equal(memberCount - 1)
  })

  it('should delete the group when the last user left', async () => {
    const user = await getUser()
    const group = await createGroup({ user })
    await leaveGroup({ group, user })
    await getGroup(group)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(404)
    })
  })
})
