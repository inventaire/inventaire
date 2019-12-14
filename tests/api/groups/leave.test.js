require('should')
const { authReq, authReqC, undesiredErr, customAuthReq } = require('../utils/utils')
const { getGroup, groupAndMemberPromise } = require('../fixtures/groups')
const endpoint = '/api/groups?action=leave'

const groupAndMember = groupAndMemberPromise()
const [ groupPromise ] = groupAndMember

describe('groups:update:leave', () => {
  it('should reject without group', done => {
    authReq('put', endpoint, { user: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' })
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: group')
      err.statusCode.should.equal(400)
      done()
    })
    .catch(done)
  })

  it('should reject leaving non group members', done => {
    groupPromise
    .then(group => authReqC('put', endpoint, { group: group._id }))
    .catch(err => {
      err.body.status_verbose.should.startWith('user is not in the group')
      err.statusCode.should.equal(403)
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should reject last admin to leave', done => {
    groupPromise
    .then(group => getGroup(group._id))
    .then(group => authReq('put', endpoint, { group: group._id }))
    .catch(err => {
      err.body.status_verbose.should.startWith("the last group admin can't leave before naming another admin")
      err.statusCode.should.equal(403)
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should leave group', done => {
    const [ groupPromise, memberPromise ] = groupAndMemberPromise()
    groupPromise
    .then(group => {
      const memberCount = group.members.length
      return customAuthReq(memberPromise, 'put', endpoint, { group: group._id })
      .then(() => getGroup(group._id))
      .then(updatedGroup => {
        updatedGroup.members.length.should.equal(memberCount - 1)
        done()
      })
    })
    .catch(undesiredErr(done))
  })
})
