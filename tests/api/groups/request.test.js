require('should')
const { authReq, authReqB, authReqC, undesiredErr } = require('../utils/utils')
const { groupPromise, getGroup } = require('../fixtures/groups')
const endpoint = '/api/groups?action=request'

describe('groups:update:accept', () => {
  it('should reject without group', done => {
    authReq('put', `${endpoint}`, { user: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' })
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: group')
      err.statusCode.should.equal(400)
      done()
    })
  })

  it('should reject request from already member users', done => {
    groupPromise
    .then(group => {
      authReqB('put', `${endpoint}`, { group: group._id })
      .catch(err => {
        err.body.status_verbose.should.startWith('user is already in group')
        err.statusCode.should.equal(403)
        done()
      })
      .catch(undesiredErr(done))
    })
  })

  it('should add user to requesters list', done => {
    groupPromise
    .then(group => {
      group.requested.length.should.equal(0)
      authReqC('put', `${endpoint}`, { group: group._id })
      .then(res => {
        getGroup(group._id)
        .then(group => {
          group.requested.length.should.equal(1)
          done()
        })
        .catch(undesiredErr(done))
      })
    })
  })
})
