require('should')
const { authReq, authReqC, undesiredErr } = require('../utils/utils')
const { groupPromise, getGroup } = require('../fixtures/groups')
const endpoint = '/api/groups?action=cancel-request'

describe('groups:update:cancel-request', () => {
  it('should reject without group', done => {
    authReq('put', `${endpoint}`, {})
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
      authReqC('put', `${endpoint}`, { group: group._id })
      .catch(err => {
        err.body.status_verbose.should.startWith('request not found')
        err.statusCode.should.equal(403)
        done()
      })
      .catch(undesiredErr(done))
    })
  })

  it('should cancel a request', done => {
    groupPromise
    .then(group => {
      authReqC('put', '/api/groups?action=request', { group: group._id })
      .then(res => {
        getGroup(group._id)
        .then(group => {
          group.requested.length.should.equal(1)
          authReqC('put', `${endpoint}`, { group: group._id })
          .then(res => {
            getGroup(group._id)
            .then(group => {
              group.requested.length.should.equal(0)
              done()
            })
            .catch(undesiredErr(done))
          })
        })
      })
    })
  })
})
