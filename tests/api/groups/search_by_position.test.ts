import { map } from 'lodash-es'
import should from 'should'
import { createGroup } from '#fixtures/groups'
import { getRandomPosition } from '#fixtures/users'
import { fixedEncodeURIComponent } from '#lib/utils/url'
import { waitForIndexation } from '#tests/api/utils/search'
import { publicReq } from '#tests/api/utils/utils'
import { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } from '#tests/unit/utils/utils'

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
    const position = getRandomPosition()
    const [ lat, lng ] = position
    const bbox = fixedEncodeURIComponent(JSON.stringify([
      lng - 1, // minLng
      lat - 1, // minLat
      lng + 1, // maxLng
      lat + 1, // maxLat
    ]))
    const group = await createGroup({ position })
    await waitForIndexation('groups', group._id)
    const res = await publicReq('get', `${endpoint}&bbox=${bbox}`)
    res.groups.should.be.an.Array()
    const groupsIds = map(res.groups, '_id')
    should(groupsIds.includes(group._id)).be.true()
  })
})
