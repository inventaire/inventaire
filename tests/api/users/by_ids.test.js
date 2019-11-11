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

describe('users:by-ids', () => it('should get a user', (done) => {
  getUser()
  .then((user) => {
    const userId = user._id
    return nonAuthReq('get', `/api/users?action=by-ids&ids=${userId}`)
    .then((res) => {
      res.users.should.be.an.Object()
      res.users[userId].should.be.an.Object()
      res.users[userId]._id.should.equal(userId)
      done()
    })}).catch(undesiredErr(done))

}))
