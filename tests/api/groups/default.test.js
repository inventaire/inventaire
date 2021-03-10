const _ = require('builders/utils')
const should = require('should')
const { authReq, publicReq, undesiredRes } = require('../utils/utils')
const { groupPromise } = require('../fixtures/groups')
const endpoint = '/api/groups'

describe('groups:get:default', () => {
  it('should reject unauthentified user', done => {
    groupPromise
    .then(group => publicReq('get', endpoint))
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('unauthorized api access')
      done()
    })
    .catch(done)
  })

  it('should get all user groups', done => {
    groupPromise
    .then(group => {
      return authReq('get', endpoint)
      .then(({ groups }) => {
        groups.should.be.an.Array()
        const groupsIds = _.map(groups, '_id')
        should(groupsIds.includes(group._id)).be.true()
        done()
      })
    })
    .catch(done)
  })
})
