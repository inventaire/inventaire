const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const should = require('should')
const { publicReq, authReq, customAuthReq, getUser, getUserB } = require('../utils/utils')
const { createUser } = require('../fixtures/users')
const { Wait } = __.require('lib', 'promises')

describe('users:search', () => {
  it('should find a user', done => {
    getUser()
    .then(Wait(1000))
    .then(user => {
      const { username } = user
      return publicReq('get', `/api/users?action=search&search=${username}`)
      .then(res => {
        usersIds(res).includes(user._id).should.be.true()
        done()
      })
    })
    .catch(done)
  })

  it('should find a user even with just a prefix', done => {
    getUser()
    .then(Wait(1000))
    .then(user => {
      const prefix = user.username.slice(0, 5)
      return publicReq('get', `/api/users?action=search&search=${prefix}`)
      .then(res => {
        usersIds(res).includes(user._id).should.be.true()
        done()
      })
    })
    .catch(done)
  })

  it('should find a user even with a typo', done => {
    // Using a user with a non-random username to make the typo not to hard
    // to recover for ElasticSearch
    const userPromise = createUser({ username: 'testuser' })
    userPromise
    .then(Wait(1000))
    .then(user => {
      return customAuthReq(userPromise, 'get', '/api/users?action=search&search=testusr')
      .then(res => {
        usersIds(res).includes(user._id).should.be.true()
        done()
      })
    })
    .catch(done)
  })

  it('should not return snapshot data', done => {
    getUserB()
    .then(Wait(1000))
    .then(user => {
      return authReq('get', `/api/users?action=search&search=${user.username}`)
      .then(res => {
        usersIds(res).includes(user._id).should.be.true()
        should(res.users[0].snapshot).not.be.ok()
        done()
      })
    })
    .catch(done)
  })

  it('should find a user by its bio', done => {
    authReq('put', '/api/user', { attribute: 'bio', value: 'blablablayouhou' })
    .catch(err => {
      if (err.body.status_verbose !== 'already up-to-date') throw err
    })
    .then(getUser)
    .then(Wait(1000))
    .then(user => {
      return publicReq('get', `/api/users?action=search&search=${user.bio}`)
      .then(res => {
        usersIds(res).includes(user._id).should.be.true()
        done()
      })
    })
    .catch(done)
  })
})

const usersIds = res => _.map(res.users, '_id')
