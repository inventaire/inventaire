const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { authReq, authReqC, undesiredRes, customAuthReq, getUserGetter } = require('../utils/utils')
const { createGroup, getGroup } = require('../fixtures/groups')
const endpoint = '/api/groups?action=refuse-request'
const { Promise } = __.require('lib', 'promises')
const { humanName } = require('../fixtures/entities')

describe('groups:update:refuse-request', () => {
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

  it('should remove user from requested list', done => {
    const memberPromise = getUserGetter(humanName(), false)()

    Promise.all([
      createGroup(),
      memberPromise
    ])
    .then(([ group, requester ]) => {
      const { _id: requesterId } = requester
      return customAuthReq(memberPromise, 'put', '/api/groups?action=request', { group: group._id })
      .then(() => {
        return authReq('put', endpoint, { user: requesterId, group: group._id })
        .then(() => getGroup(group))
      })
    })
    .then(group => {
      group.requested.length.should.equal(0)
      done()
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
