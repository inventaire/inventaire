const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const should = require('should')
const { publicReq, shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = __.require('apiTests', 'utils/utils')
const { createGroup } = require('../fixtures/groups')
const qs = require('querystring')
const endpoint = '/api/groups?action=search-by-position'

describe('groups:search-by-position', () => {
  it('should reject without bbox', async () => {
    try {
      await publicReq('get', endpoint)
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in query: bbox')
    }
  })

  it('should get groups by position', async () => {
    const group = await createGroup({ position: [ 10, 10 ] })
    const bbox = qs.escape(JSON.stringify([ 9, 9, 11, 11 ]))
    const res = await publicReq('get', `${endpoint}&bbox=${bbox}`)
    res.groups.should.be.an.Array()
    const groupsIds = _.map(res.groups, '_id')
    should(groupsIds.includes(group._id)).be.true()
  })
})
