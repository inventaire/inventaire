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
const { authReq, undesiredErr } = __.require('apiTests', 'utils/utils')

describe('notifications:get', () => it('should get user notifications', (done) => {
  authReq('get', '/api/notifications')
  .then((res) => {
    res.notifications.should.be.an.Array()
    return done()}).catch(undesiredErr(done))

}))
