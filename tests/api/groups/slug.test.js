require('should')
const { publicReq } = require('../utils/utils')
const slugify = require('controllers/groups/lib/slugify')
const endpoint = '/api/groups?action=slug'

describe('groups:get:slug', () => {
  it('should reject without name', done => {
    publicReq('get', endpoint)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: name')
      done()
    })
    .catch(done)
  })

  it('should return a slug', done => {
    const name = 'he"ll_oa% $ az}d a"\'z a(ù]ùd azd'
    const encodedName = encodeURIComponent(name)
    publicReq('get', `${endpoint}&name=${encodedName}`)
    .then(res => {
      res.slug.should.equal(slugify(name))
      done()
    })
    .catch(done)
  })
})
