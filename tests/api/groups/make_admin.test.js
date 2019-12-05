const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const { authReq, authReqB, undesiredErr, undesiredRes, getUserB, getUserC } = require('../utils/utils')
const { groupPromise, getGroup } = require('../fixtures/groups')
const endpoint = '/api/groups?action=make-admin'
const { Promise } = __.require('lib', 'promises')

describe('groups:update:make-admin', () => {
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

  it('should reject request by non admin', done => {
    Promise.all([ groupPromise, getUserB() ])
    .spread((group, member) => {
      const { _id: memberId } = member
      authReq('put', '/api/groups?action=invite', { user: memberId, group: group._id })
      .then(() => {
        group.members.length.should.equal(1)
        authReqB('put', `${endpoint}`, { user: memberId, group: group._id })
        .catch(err => {
          err.body.status_verbose.should.startWith('user isnt a group admin')
          err.statusCode.should.equal(403)
          done()
        })
        .catch(undesiredErr(done))
      })
    })
  })

  it('should add an admin', done => {
    Promise.all([ groupPromise, getUserB() ])
    .spread((group, member) => {
      const { _id: memberId } = member
      group.admins.length.should.equal(1)
      authReq('put', `${endpoint}`, { user: memberId, group: group._id })
      .then(res => {
        getGroup(group._id)
        .then(group => {
          group.admins.length.should.equal(2)
          group.admins.map(_.property('user')).should.containEql(memberId)
          done()
        })
      })
      .catch(undesiredErr(done))
    })
  })
})
