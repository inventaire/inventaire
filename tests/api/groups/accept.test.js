const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const { authReq, authReqB, undesiredRes, getUserC, getUserGetter, customAuthReq } = require('../utils/utils')
const { groupPromise, getGroup } = require('../fixtures/groups')
const endpoint = '/api/groups?action=accept'
const { Promise } = __.require('lib', 'promises')
const { humanName } = require('../fixtures/entities')

describe('groups:update:accept', () => {
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
    .spread((group, user) => {
      return authReq('put', endpoint, { user: user._id, group: group._id })
    })
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.startWith('membership not found')
      err.statusCode.should.equal(403)
      done()
    })
    .catch(done)
  })

  it('should reject invite accepted by another user', done => {
    Promise.all([ groupPromise, getUserC() ])
    .spread((group, user) => {
      const { _id: userId } = user
      return authReq('put', '/api/groups?action=invite', { user: userId, group: group._id })
      .then(() => {
        group.members.length.should.equal(1)
        return authReqB('put', endpoint, { user: userId, group: group._id })
      })
    })
    .catch(err => {
      err.body.status_verbose.should.startWith('membership not found')
      err.statusCode.should.equal(403)
      done()
    })
    .catch(done)
  })

  it('should add a member when user is accepting an invite', done => {
    const userPromise = getUserGetter(humanName(), false)()

    Promise.all([ groupPromise, userPromise ])
    .spread((group, user) => {
      const { _id: userId } = user
      return authReq('put', '/api/groups?action=invite', { user: userId, group: group._id })
      .then(() => {
        const memberCount = group.members.length
        return customAuthReq(userPromise, 'put', endpoint, { user: userId, group: group._id })
        .then(() => getGroup(group._id))
        .then(updatedGroup => {
          updatedGroup.members.length.should.equal(memberCount + 1)
          updatedGroup.members.map(_.property('user')).should.containEql(userId)
          done()
        })
      })
    })
    .catch(done)
  })
})
