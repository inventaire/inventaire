const _ = require('builders/utils')
require('should')
const { authReq, authReqB, getUserGetter, shouldNotBeCalled } = require('../utils/utils')
const { groupPromise, getGroup, addMember } = require('../fixtures/groups')
const endpoint = '/api/groups?action=make-admin'
const { humanName } = require('../fixtures/entities')

describe('groups:update:make-admin', () => {
  it('should reject without group', async () => {
    await authReq('put', endpoint, { user: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: group')
      err.statusCode.should.equal(400)
    })
  })

  it('should reject non member users', async () => {
    const group = await groupPromise
    await authReq('put', endpoint, { user: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', group: group._id })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('membership not found')
      err.statusCode.should.equal(403)
    })
  })

  it('should reject request by non admin', async () => {
    const memberPromise = getUserGetter(humanName())()
    const [ group, member ] = await addMember(groupPromise, memberPromise)
    const { _id: memberId } = member
    await authReqB('put', endpoint, { user: memberId, group: group._id })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('user is not a group admin')
      err.statusCode.should.equal(403)
    })
  })

  it('should add an admin', async () => {
    const memberPromise = getUserGetter(humanName())()
    const [ group, member ] = await addMember(groupPromise, memberPromise)
    const { _id: memberId } = member
    const adminsCount = group.admins.length
    await authReq('put', endpoint, { user: memberId, group: group._id })
    const updatedGroup = await getGroup(group)
    updatedGroup.admins.length.should.equal(adminsCount + 1)
    updatedGroup.admins.map(_.property('user')).should.containEql(memberId)
  })
})
