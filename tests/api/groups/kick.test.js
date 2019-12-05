const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { authReq, customAuthReq, getUserGetter, undesiredErr, undesiredRes, getUserB, getUserC } = require('../utils/utils')
const { groupPromise, getGroup } = require('../fixtures/groups')
const endpoint = '/api/groups?action=kick'
const { Promise } = __.require('lib', 'promises')

describe('groups:update:kick', () => {
  it('should reject without group', done => {
    authReq('put', `${endpoint}`, { user: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' })
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: group')
      err.statusCode.should.equal(400)
      done()
    })
  })

  it('should reject non member users', done => {
    Promise.all([ groupPromise, getUserC() ])
    .spread((group, nonInvitedUser) => {
      authReq('put', `${endpoint}`, { user: nonInvitedUser._id, group: group._id })
      .then(undesiredRes(done))
      .catch(err => {
        err.body.status_verbose.should.startWith('membership not found')
        err.statusCode.should.equal(403)
        done()
      })
    })
    .catch(undesiredErr(done))
  })

  it('should kick a member', done => {
    Promise.all([ groupPromise, getUserB() ])
    .spread((group, member) => {
      const { _id: memberId } = member
      group.members.length.should.equal(1)
      authReq('put', `${endpoint}`, { user: memberId, group: group._id })
      .then(res => {
        getGroup(group._id)
        .then(group => {
          group.members.length.should.equal(0)
          done()
        })
      })
      .catch(undesiredErr(done))
    })
  })

  it('should reject kicking an admin', done => {
    const memberPromise = getUserGetter('foo', false)()
    Promise.all([ groupPromise, memberPromise ])
    .spread((group, member) => {
      const { _id: memberId } = member
      customAuthReq(memberPromise, 'put', '/api/groups?action=request', { group: group._id })
      .then(() => {
        authReq('put', '/api/groups?action=accept-request', { user: memberId, group: group._id })
        .then(() => {
          authReq('put', '/api/groups?action=make-admin', { user: memberId, group: group._id })
          .then(() => {
            authReq('put', `${endpoint}`, { user: memberId, group: group._id })
            .catch(err => {
              err.body.status_verbose.should.startWith('target user is also a group admin')
              err.statusCode.should.equal(403)
              done()
            })
          })
        })
      })
      .catch(undesiredErr(done))
    })
  })
})
