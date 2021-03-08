const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = require('builders/utils')
const should = require('should')
const { publicReq, shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('apiTests/utils/utils')
const { createGroup } = require('../fixtures/groups')
const { getRandomPosition } = require('../fixtures/users')
const { waitForIndexation } = require('../utils/search')
const endpoint = '/api/groups?action=search-by-position'
const qs = require('querystring')

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
    const position = getRandomPosition()
    const [ lat, lng ] = position
    const bbox = qs.escape(JSON.stringify([
      lng - 1, // minLng
      lat - 1, // minLat
      lng + 1, // maxLng
      lat + 1, // maxLat
    ]))
    const group = await createGroup({ position })
    await waitForIndexation('groups', group._id)
    const res = await publicReq('get', `${endpoint}&bbox=${bbox}`)
    res.groups.should.be.an.Array()
    const groupsIds = _.map(res.groups, '_id')
    should(groupsIds.includes(group._id)).be.true()
  })
})
