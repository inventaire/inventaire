const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { authReq, getUserGetter, undesiredRes } = require('../utils/utils')
const { groupPromise, getGroup, addMember } = require('../fixtures/groups')
const endpoint = '/api/groups?action=kick'
const { Wait } = __.require('lib', 'promises')
const { humanName } = require('../fixtures/entities')
const userPromise = getUserGetter(humanName(), false)()

describe('groups:update:kick', () => {
  it('should reject without group', done => {
    authReq('put', endpoint, { user: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' })
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: group')
      err.statusCode.should.equal(400)
      done()
    })
  })

  it('should reject non member users', done => {
    Promise.all([ groupPromise, userPromise ])
    .then(([ group, nonInvitedUser ]) => {
      return authReq('put', endpoint, { user: nonInvitedUser._id, group: group._id })
    })
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.startWith('membership not found')
      err.statusCode.should.equal(403)
      done()
    })
    .catch(done)
  })

  it('should kick a member', done => {
    addMember({ group: groupPromise, user: userPromise })
    .then(([ group, member ]) => {
      const membersCount = group.members.length
      return authReq('put', endpoint, { user: member._id, group: group._id })
      .then(Wait(100))
      .then(() => getGroup(group))
      .then(updatedGroup => {
        updatedGroup.members.length.should.equal(membersCount - 1)
        done()
      })
    })
    .catch(done)
  })

  it('should reject kicking an admin', done => {
    addMember({ group: groupPromise, user: userPromise })
    .then(([ group, member ]) => {
      const { _id: memberId } = member
      return authReq('put', '/api/groups?action=make-admin', { user: memberId, group: group._id })
      .then(() => {
        return authReq('put', endpoint, { user: memberId, group: group._id })
      })
    })
    .catch(err => {
      err.body.status_verbose.should.startWith('target user is also a group admin')
      err.statusCode.should.equal(403)
      done()
    })
    .catch(done)
  })
})
