const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { nonAuthReq, undesiredErr } = require('../utils/utils')
const slugify = __.require('controllers', 'groups/lib/slugify')

describe('groups:get:slug', () => {
  it('should return a slug', done => {
    const name = 'he"ll_oa% $ az}d a"\'z a(ù]ùd azd'
    const encodedName = encodeURIComponent(name)
    nonAuthReq('get', `/api/groups?action=slug&name=${encodedName}`)
    .then(res => {
      res.slug.should.equal(slugify(name))
      done()
    })
    .catch(undesiredErr(done))
  })
})
