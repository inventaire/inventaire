require('should')
const { authReq, authReqC, customAuthReq } = require('../utils/utils')
const { getGroup, createGroupAndMember } = require('../fixtures/groups')
const { shouldNotBeCalled } = require('tests/unit/utils')
const endpoint = '/api/groups?action=leave'

const groupAndMemberPromise = createGroupAndMember()

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
    const [ group ] = await groupAndMemberPromise
    await authReqC('put', endpoint, { group: group._id })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('user is not in the group')
      err.statusCode.should.equal(403)
    })
  })

  it('should reject last admin to leave', async () => {
    const [ group ] = await groupAndMemberPromise
    await authReq('put', endpoint, { group: group._id })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith("the last group admin can't leave before naming another admin")
      err.statusCode.should.equal(403)
    })
  })

  it('should leave group', async () => {
    const [ group, member ] = await groupAndMemberPromise
    const memberCount = group.members.length
    await customAuthReq(member, 'put', endpoint, { group: group._id })
    const updatedGroup = await getGroup(group)
    updatedGroup.members.length.should.equal(memberCount - 1)
  })
})
