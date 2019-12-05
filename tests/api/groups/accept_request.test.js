const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const { authReq, authReqC, undesiredErr, undesiredRes, getUserC } = require('../utils/utils')
const { groupPromise, createGroup, groupName, getGroup } = require('../fixtures/groups')
const { createUser } = require('../fixtures/users')
const endpoint = '/api/groups?action=accept-request'
const { Promise } = __.require('lib', 'promises')

describe('groups:update:accept-request', () => {
  it('should reject without a user', done => {
    authReq('put', `${endpoint}`, {})
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: group')
      err.statusCode.should.equal(400)
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should reject without group', done => {
    createUser()
    .then(user => {
      authReq('put', `${endpoint}`, { group: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' })
      .then(undesiredRes(done))
      .catch(err => {
        err.body.status_verbose.should.equal('missing parameter in body: user')
        err.statusCode.should.equal(400)
        done()
      })
    })
    .catch(undesiredErr(done))
  })

  it('should move requested user to members', done => {
    // Resolves to a group with userA as admin and userB as member
    Promise.all([ groupPromise, getUserC() ])
    .spread((group, requester) => {
      const { _id: requesterId } = requester
      authReqC('put', '/api/groups?action=request', { group: group._id })
      .then(res => {
        authReq('put', `${endpoint}`, { user: requesterId, group: group._id })
        .then(() => {
          getGroup(group._id)
          .then(group => {
            group.members.length.should.equal(2)
            group.members.map(_.property('user')).should.containEql(requesterId)
            done()
          })
        })
        .catch(undesiredErr(done))
      })
    })
  })

  it('reject if not admin user', done => {
    createGroup(groupName())
    .then(group => {
      authReqC('put', `${endpoint}`, { user: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', group: group._id })
      .catch(err => {
        err.body.status_verbose.should.equal('user is not admin')
        err.statusCode.should.equal(403)
        done()
      })
      .catch(undesiredErr(done))
    })
  })
})
