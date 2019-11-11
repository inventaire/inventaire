// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS204: Change includes calls to have a more natural evaluation order
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const should = require('should')
const { nonAuthReq, authReq, customAuthReq, getUser, getUserB, undesiredErr } = require('../utils/utils')
const { createUser } = require('../fixtures/users')

describe('users:search', () => {
  it('should find a user', (done) => {
    getUser()
    .delay(1000)
    .then((user) => {
      const { username } = user
      return nonAuthReq('get', `/api/users?action=search&search=${username}`)
      .then((res) => {
        let needle;
        ((needle = user._id, usersIds(res).includes(needle))).should.be.true()
        done()
      })}).catch(undesiredErr(done))

  })

  it('should find a user even with just a prefix', (done) => {
    getUser()
    .delay(1000)
    .then((user) => {
      const prefix = user.username.slice(0, 5)
      return nonAuthReq('get', `/api/users?action=search&search=${prefix}`)
      .then((res) => {
        let needle;
        ((needle = user._id, usersIds(res).includes(needle))).should.be.true()
        done()
      })}).catch(undesiredErr(done))

  })

  it('should find a user even with a typo', (done) => {
    // Using a user with a non-random username to make the typo not to hard
    // to recover for ElasticSearch
    const userPromise = createUser({ username: 'testuser' })
    userPromise
    .delay(1000)
    .then(user => customAuthReq(userPromise, 'get', '/api/users?action=search&search=testusr')
    .then((res) => {
      let needle;
      ((needle = user._id, usersIds(res).includes(needle))).should.be.true()
      done()
    })).catch(undesiredErr(done))

  })

  it('should not return snapshot data', (done) => {
    getUserB()
    .delay(1000)
    .then(user => authReq('get', `/api/users?action=search&search=${user.username}`)
    .then((res) => {
      let needle;
      ((needle = user._id, usersIds(res).includes(needle))).should.be.true()
      should(res.users[0].snapshot).not.be.ok()
      done()
    })).catch(undesiredErr(done))

  })

  it('should find a user by its bio', (done) => {
    authReq('put', '/api/user', { attribute: 'bio', value: 'blablablayouhou' })
    .catch((err) => {
      if (err.body.status_verbose === 'already up-to-date') { return
      } else { throw err }}).then(getUser)
    .delay(1000)
    .then(user => nonAuthReq('get', `/api/users?action=search&search=${user.bio}`)
    .then((res) => {
      let needle;
      ((needle = user._id, usersIds(res).includes(needle))).should.be.true()
      done()
    })).catch(undesiredErr(done))

  })
})

var usersIds = res => _.map(res.users, '_id')
