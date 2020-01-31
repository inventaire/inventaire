const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const { authReq, authReqC, undesiredRes, getUserGetter, customAuthReq } = require('../utils/utils')
const { groupPromise, createGroup, getGroup } = require('../fixtures/groups')
const endpoint = '/api/groups?action=accept-request'
const { Promise } = __.require('lib', 'promises')
const { humanName } = require('../fixtures/entities')

describe('groups:update:accept-request', () => {
  it('should reject without a group', done => {
    authReq('put', endpoint, {})
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: group')
      err.statusCode.should.equal(400)
      done()
    })
    .catch(done)
  })

  it('should move requested user to members', done => {
    const requesterPromise = getUserGetter(humanName(), false)()

    Promise.all([ groupPromise, requesterPromise ])
    .spread((group, requester) => {
      const { _id: requesterId } = requester
      return customAuthReq(requesterPromise, 'put', '/api/groups?action=request', { group: group._id })
      .then(() => authReq('put', endpoint, { user: requesterId, group: group._id }))
      .then(() => getGroup(group))
      .then(updatedGroup => {
        updatedGroup.members.map(_.property('user')).should.containEql(requesterId)
        done()
      })
    })
    .catch(done)
  })

  it('reject if not admin user', done => {
    createGroup()
    .then(group => {
      return authReqC('put', endpoint, { user: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', group: group._id })
    })
    .catch(err => {
      err.body.status_verbose.should.equal('user is not admin')
      err.statusCode.should.equal(403)
      done()
    })
    .catch(done)
  })
})
