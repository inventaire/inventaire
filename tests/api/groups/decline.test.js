const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { authReq, authReqB, authReqC, undesiredErr, undesiredRes, getUserC } = require('../utils/utils')
const { groupPromise, getGroup } = require('../fixtures/groups')
const endpoint = '/api/groups?action=decline'
const { Promise } = __.require('lib', 'promises')

describe('groups:update:decline', () => {
  it('should reject without group', done => {
    authReq('put', endpoint, { user: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' })
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: group')
      err.statusCode.should.equal(400)
      done()
    })
  })

  it('should reject non invited users', done => {
    Promise.all([ groupPromise, getUserC() ])
    .spread((group, nonInvitedUser) => {
      authReq('put', endpoint, { user: nonInvitedUser._id, group: group._id })
      .then(undesiredRes(done))
      .catch(err => {
        err.body.status_verbose.should.startWith('membership not found')
        err.statusCode.should.equal(403)
        done()
      })
    })
    .catch(undesiredErr(done))
  })

  it('should reject invite declined by another user', done => {
    Promise.all([ groupPromise, getUserC() ])
    .spread((group, invitedUser) => {
      const { _id: invitedUserId } = invitedUser
      authReq('put', '/api/groups?action=invite', { user: invitedUserId, group: group._id })
      .then(() => {
        authReqB('put', endpoint, { user: invitedUserId, group: group._id })
        .catch(err => {
          err.body.status_verbose.should.startWith('membership not found')
          err.statusCode.should.equal(403)
          done()
        })
        .catch(undesiredErr(done))
      })
    })
  })

  it('should remove member from invited', done => {
    Promise.all([ groupPromise, getUserC() ])
    .spread((group, invitedUser) => {
      const { _id: invitedUserId } = invitedUser
      authReq('put', '/api/groups?action=invite', { user: invitedUserId, group: group._id })
      .then(() => {
        getGroup(group._id)
        .then(group => {
          const declinerCount = group.declined.length
          authReqC('put', endpoint, { user: invitedUserId, group: group._id })
          .then(() => {
            getGroup(group._id)
            .then(group => {
              group.declined.length.should.equal(declinerCount + 1)
              done()
            })
          })
          .catch(undesiredErr(done))
        })
      })
    })
  })
})
