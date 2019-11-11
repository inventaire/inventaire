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
const { createUser } = require('../fixtures/users')
const randomString = __.require('lib', './utils/random_string')

describe('users:by-usernames', () => it('should get a user with a non lowercase username', (done) => {
  let username = 'notAllLowerCase' + randomString(4)
  const lowerCasedUsername = username.toLowerCase()
  createUser({ username })
  .delay(10)
  .then((user) => {
    ({ username } = user)
    return nonAuthReq('get', `/api/users?action=by-usernames&usernames=${username}`)
    .then((res) => {
      const { users } = res
      users.should.be.an.Object()
      should(users[username]).not.be.ok()
      users[lowerCasedUsername].should.be.an.Object()
      users[lowerCasedUsername].username.should.equal(username)
      return done()
    })}).catch(undesiredErr(done))

}))
