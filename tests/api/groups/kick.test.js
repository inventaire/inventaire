require('should')
const { authReq, getUserGetter } = require('../utils/utils')
const { groupPromise, getGroup, addMember } = require('../fixtures/groups')
const endpoint = '/api/groups?action=kick'
const { wait } = require('lib/promises')
const { humanName } = require('../fixtures/entities')
const { shouldNotBeCalled } = require('tests/unit/utils')
const userPromise = getUserGetter(humanName())()

describe('groups:update:kick', () => {
  it('should reject without group', async () => {
    await authReq('put', endpoint, { user: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: group')
      err.statusCode.should.equal(400)
    })
  })

  it('should reject non member users', async () => {
    const [ group, nonInvitedUser ] = await Promise.all([ groupPromise, userPromise ])
    await authReq('put', endpoint, { user: nonInvitedUser._id, group: group._id })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('membership not found')
      err.statusCode.should.equal(403)
    })
  })

  it('should kick a member', async () => {
    const [ group, member ] = await addMember(groupPromise, userPromise)
    const membersCount = group.members.length
    await authReq('put', endpoint, { user: member._id, group: group._id })
    await wait(100)
    const updatedGroup = await getGroup(group)
    updatedGroup.members.length.should.equal(membersCount - 1)
  })

  it('should reject kicking an admin', async () => {
    const [ group, member ] = await addMember(groupPromise, userPromise)
    const { _id: memberId } = member
    await authReq('put', '/api/groups?action=make-admin', { user: memberId, group: group._id })
    await authReq('put', endpoint, { user: memberId, group: group._id })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('target user is also a group admin')
      err.statusCode.should.equal(403)
    })
  })
})
