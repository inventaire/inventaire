import { shouldNotBeCalled } from '#tests/unit/utils'
import { publicReq } from '../utils/utils.js'
import { createGroup } from '../fixtures/groups.js'

const endpoint = '/api/groups?action=by-slug'

describe('groups:by-slug', () => {
  it('should reject without slug', async () => {
    await publicReq('get', endpoint)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: slug')
    })
  })

  it('should get a group by slug', async () => {
    const group = await createGroup()
    const res = await publicReq('get', `${endpoint}&slug=${group.slug}`)
    res.group._id.should.equal(group._id)
    res.group.name.should.equal(group.name)
    res.group.slug.should.equal(group.slug)
  })
})
