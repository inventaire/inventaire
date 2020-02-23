require('should')
const { authReq, authReqB, getUserB, undesiredRes } = require('../utils/utils')
const { createGroup, getGroup, addMember } = require('../fixtures/groups')
const endpoint = '/api/groups?action=invite'

describe('groups:update:invite', () => {
  it('should reject without a group', done => {
    authReq('put', endpoint, {})
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: group')
      err.statusCode.should.equal(400)
      done()
    })
    .catch(done)
  })

  it('should add an invited when invitor is admin', done => {
    createGroup()
    .then(group => {
      const invitedCount = group.invited.length
      return authReq('put', endpoint, { user: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', group: group._id })
      .then(() => getGroup(group))
      .then(updatedGroup => {
        updatedGroup.invited.length.should.equal(invitedCount + 1)
        done()
      })
    })
    .catch(done)
  })

  it('should add an invited when invitor is member', async () => {
    const group = await createGroup()
    const userB = await getUserB()
    await addMember({ group, user: userB })
    await authReqB('put', endpoint, { user: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', group: group._id })
    const updatedGroup = await getGroup(group)
    updatedGroup.invited.length.should.equal(1)
  })

  it('reject if invitor is not group member', done => {
    createGroup()
    .then(group => {
      return authReqB('put', endpoint, { user: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', group: group._id })
    })
    .catch(err => {
      err.body.status_verbose.should.equal("invitor isn't in group")
      err.statusCode.should.equal(403)
      done()
    })
    .catch(done)
  })
})
