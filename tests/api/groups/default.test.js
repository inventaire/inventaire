const _ = require('builders/utils')
const should = require('should')
const { authReq, publicReq } = require('../utils/utils')
const { shouldNotBeCalled } = require('tests/unit/utils')
const { groupPromise } = require('../fixtures/groups')
const endpoint = '/api/groups'

describe('groups:get:default', () => {
  it('should reject unauthentified user', async () => {
    await publicReq('get', endpoint)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('unauthorized api access')
    })
  })

  it('should get all user groups', async () => {
    const group = await groupPromise
    const { groups } = await authReq('get', endpoint)
    groups.should.be.an.Array()
    const groupsIds = _.map(groups, '_id')
    should(groupsIds.includes(group._id)).be.true()
  })
})
