require('should')
const { authReq, authReqB, authReqC, undesiredErr } = require('../utils/utils')
const { groupPromise, getGroup } = require('../fixtures/groups')
const endpoint = '/api/groups?action=leave'

describe('groups:update:leave', () => {
  it('should reject without group', done => {
    authReq('put', `${endpoint}`, { user: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' })
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: group')
      err.statusCode.should.equal(400)
      done()
    })
  })

  it('should reject leaving non group members', done => {
    groupPromise
    .then(group => {
      authReqC('put', `${endpoint}`, { group: group._id })
      .catch(err => {
        err.body.status_verbose.should.startWith('user is not in the group')
        err.statusCode.should.equal(403)
        done()
      })
      .catch(undesiredErr(done))
    })
  })

  it('should reject last admin to leave', done => {
    groupPromise
    .then(group => {
      authReq('put', `${endpoint}`, { group: group._id })
      .catch(err => {
        err.body.status_verbose.should.startWith("the last group admin can't leave before naming another admin")
        err.statusCode.should.equal(403)
        done()
      })
      .catch(undesiredErr(done))
    })
  })

  it('should leave group', done => {
    groupPromise
    .then(group => {
      authReqB('put', `${endpoint}`, { group: group._id })
      .then(res => {
        getGroup(group._id)
        .then(group => {
          group.members.length.should.equal(0)
          done()
        })
        .catch(undesiredErr(done))
      })
    })
  })
})
