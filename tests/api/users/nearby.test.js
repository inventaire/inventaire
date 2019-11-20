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
require('should')
const { getUserGetter, customAuthReq, undesiredErr } = __.require('apiTests', 'utils/utils')
const geolocatedUser1Promise = getUserGetter('geo1', false, { position: [ 1, 1 ] })().delay(2000)
const geolocatedUser2Promise = getUserGetter('geo2', false, { position: [ 40, 40 ] })().delay(2000)
const endpoint = '/api/users?action=nearby'

describe('users:nearby', () => {
  it('should get users nearby', done => {
    geolocatedUser1Promise
    .then(user1 => customAuthReq(geolocatedUser2Promise, 'get', endpoint)
    .then(res => {
      const usersIds = _.map(res.users, '_id')
      usersIds.includes(user1._id).should.be.true()
      done()
    }))
    .catch(undesiredErr(done))
  })

  it('should accept a range', done => {
    geolocatedUser1Promise
    .then(user1 => customAuthReq(geolocatedUser2Promise, 'get', `${endpoint}&range=1`)
    .then(res => {
      const usersIds = _.map(res.users, '_id')
      usersIds.includes(user1._id).should.be.false()
      done()
    }))
    .catch(undesiredErr(done))
  })
})
