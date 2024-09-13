import { createGroup } from '#fixtures/groups'
import { publicReq } from '#tests/api/utils/utils'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'

const endpoint = '/api/groups?action=by-id'

describe('groups:by-id', () => {
  it('should reject without id', async () => {
    await publicReq('get', endpoint)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: id')
    })
  })

  it('should get a group by id', async () => {
    const group = await createGroup()
    const res = await publicReq('get', `${endpoint}&id=${group._id}`)
    res.group._id.should.equal(group._id)
    res.group.name.should.equal(group.name)
    res.group.slug.should.equal(group.slug)
  })
})
