const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { nonAuthReq, undesiredErr } = require('../utils/utils')
const slugify = __.require('controllers', 'groups/lib/slugify')
const endpoint = '/api/groups?action=slug'

describe('groups:get:slug', () => {
  it('should reject without name', done => {
    nonAuthReq('get', endpoint)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: name')
      done()
    })
    .catch(done)
  })

  it('should return a slug', done => {
    const name = 'he"ll_oa% $ az}d a"\'z a(ù]ùd azd'
    const encodedName = encodeURIComponent(name)
    nonAuthReq('get', `${endpoint}&name=${encodedName}`)
    .then(res => {
      res.slug.should.equal(slugify(name))
      done()
    })
    .catch(undesiredErr(done))
  })
})
