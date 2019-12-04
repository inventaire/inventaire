const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { authReq, authReqB, undesiredErr, undesiredRes } = require('../utils/utils')
const { groupPromise, createGroup, groupName, getGroup } = require('../fixtures/groups')
const { createUser } = require('../fixtures/users')
const endpoint = '/api/groups?action=invite'

describe('groups:update:invite', () => {
  it('should reject without a user', done => {
    authReq('put', `${endpoint}`, {})
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: user')
      err.statusCode.should.equal(400)
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should reject without group', done => {
    createUser()
    .then(user => {
      authReq('put', `${endpoint}`, { user: user._id })
      .then(undesiredRes(done))
      .catch(err => {
        err.body.status_verbose.should.equal('missing parameter in body: group')
        err.statusCode.should.equal(400)
        done()
      })
    })
    .catch(undesiredErr(done))
  })

  it('should add an invited when invitor is admin', done => {
    createGroup(groupName())
    .then(group => {
      group.invited.length.should.equal(0)
      authReq('put', `${endpoint}`, { user: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', group: group._id })
      .then(() => {
        getGroup(group._id)
        .then(group => {
          group.invited.length.should.equal(1)
          done()
        })
      })
      .catch(undesiredErr(done))
    })
  })

  it('should add an invited when invitor is member', done => {
    // Resolves to a group with userA as admin and userB as member
    groupPromise
    .then(group => {
      group.invited.length.should.equal(0)
      authReqB('put', `${endpoint}`, { user: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', group: group._id })
      .then(() => {
        getGroup(group._id)
        .then(group => {
          group.invited.length.should.equal(1)
          done()
        })
      })
      .catch(undesiredErr(done))
    })
  })

  it('reject if invitor is not group member', done => {
    createGroup(groupName())
    .then(group => {
      authReqB('put', `${endpoint}`, { user: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', group: group._id })
      .catch(err => {
        err.body.status_verbose.should.equal("invitor isn't in group")
        err.statusCode.should.equal(403)
        done()
      })
      .catch(undesiredErr(done))
    })
  })
})
