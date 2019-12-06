const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { authReq, authReqC, undesiredErr, getUserGetter, customAuthReq } = require('../utils/utils')
const { groupPromise, getGroup } = require('../fixtures/groups')
const endpoint = '/api/groups?action=cancel-request'
const { Promise } = __.require('lib', 'promises')
const { humanName } = require('../fixtures/entities')

describe('groups:update:cancel-request', () => {
  it('should reject without group', done => {
    authReq('put', endpoint, {})
    .catch(err => {
      err.body.status_verbose.should.startWith('missing parameter in body: group')
      err.statusCode.should.equal(400)
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should reject when no request exists for user', done => {
    groupPromise
    .then(group => {
      authReqC('put', endpoint, { group: group._id })
      .catch(err => {
        err.body.status_verbose.should.startWith('request not found')
        err.statusCode.should.equal(403)
        done()
      })
      .catch(undesiredErr(done))
    })
  })

  it('should cancel a request', done => {
    const requesterPromise = getUserGetter(humanName(), false)()
    Promise.all([ groupPromise, requesterPromise ])
    .spread((group, requester) => {
      customAuthReq(requesterPromise, 'put', '/api/groups?action=request', { group: group._id })
      .then(() => {
        getGroup(group._id)
        .then(group => {
          const requesterCount = group.requested.length
          customAuthReq(requesterPromise, 'put', endpoint, { group: group._id })
          .then(() => {
            getGroup(group._id)
            .then(group => {
              group.requested.length.should.equal(requesterCount - 1)
              done()
            })
            .catch(undesiredErr(done))
          })
        })
      })
    })
  })
})
