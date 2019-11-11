// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const should = require('should')
const { nonAuthReq, getUser, undesiredErr } = require('../utils/utils')
const slugify = __.require('controllers', 'groups/lib/slugify')

describe('groups:get:slug', () => it('should return a slug', (done) => {
  const name = 'he"ll_oa% $ az}d a"\'z a(ù]ùd azd'
  const encodedName = encodeURIComponent(name)
  nonAuthReq('get', `/api/groups?action=slug&name=${encodedName}`)
  .then((res) => {
    res.slug.should.equal(slugify(name))
    return done()}).catch(undesiredErr(done))

}))
