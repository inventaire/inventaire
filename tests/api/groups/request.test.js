require('should')
const { authReq, authReqB, authReqC } = require('../utils/utils')
const { groupPromise, getGroup, createGroup } = require('../fixtures/groups')
const endpoint = '/api/groups?action=request'

describe('groups:update:request', () => {
  it('should reject without group', done => {
    authReq('put', endpoint, { user: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' })
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: group')
      err.statusCode.should.equal(400)
      done()
    })
    .catch(done)
  })

  it('should reject request from already member users', done => {
    groupPromise
    .then(group => authReqB('put', endpoint, { group: group._id }))
    .catch(err => {
      err.body.status_verbose.should.startWith('user is already in group')
      err.statusCode.should.equal(403)
      done()
    })
    .catch(done)
  })

  it('should add user to requesters list', done => {
    createGroup()
    .then(group => {
      const requestCount = group.invited.length
      return authReqC('put', endpoint, { group: group._id })
      .then(() => getGroup(group))
      .then(group => {
        group.requested.length.should.equal(requestCount + 1)
        done()
      })
    })
    .catch(done)
  })
})
