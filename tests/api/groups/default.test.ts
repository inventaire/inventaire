import { map } from 'lodash-es'
import should from 'should'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'
import { getSomeGroup } from '../fixtures/groups.js'
import { authReq, publicReq } from '../utils/utils.js'

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
    const group = await getSomeGroup()
    const { groups } = await authReq('get', endpoint)
    groups.should.be.an.Array()
    const groupsIds = map(groups, '_id')
    should(groupsIds.includes(group._id)).be.true()
  })
})
