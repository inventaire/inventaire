// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { authReq, undesiredErr } = require('../utils/utils')
const { groupName } = require('../fixtures/groups')
const slugify = __.require('controllers', 'groups/lib/slugify')

describe('groups:create', () => {
  it('should create a group', done => {
    const name = groupName()
    authReq('post', '/api/groups?action=create', { name })
    .then(res => {
      res.name.should.equal(name)
      res.slug.should.equal(slugify(name))
      res.searchable.should.be.true()
      res.creator.should.equal(res.admins[0].user)
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should reject a group with an empty name or generated slug', done => {
    const name = '??'
    authReq('post', '/api/groups?action=create', { name })
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.error_name.should.equal('invalid_name')
      done()
    })
    .catch(undesiredErr(done))
  })
})
