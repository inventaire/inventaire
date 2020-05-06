const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { tap } = __.require('lib', 'promises')
const host = CONFIG.fullHost()
const authEndpoint = `${host}/api/auth`
const faker = require('faker')
const { makeUserAdmin } = __.require('controllers', 'user/lib/user')
const { request, rawRequest } = require('../utils/request')
const { makeFriends } = require('../utils/relations')
const randomString = __.require('lib', './utils/random_string')
let twoFriendsPromise

// Working around the circular dependency
let getUser, getReservedUser
const lateRequire = () => {
  ({ getUser, getReservedUser } = require('../utils/utils'))
}
setTimeout(lateRequire, 0)

const connect = (endpoint, userData) => rawRequest('post', endpoint, { body: userData })
const signup = userData => connect(`${authEndpoint}?action=signup`, userData)
const loginOrSignup = userData => {
  return connect(`${authEndpoint}?action=login`, userData)
  .catch(err => {
    if (err.statusCode !== 401) throw err
    return signup(userData)
  })
}

const API = module.exports = {
  signup: email => {
    return signup({
      email,
      username: API.createUsername(),
      password: faker.internet.password()
    })
  },

  createUser: (customData = {}) => {
    const username = customData.username || API.createUsername()
    const userData = {
      username,
      password: '12345678',
      email: `${username}@adomain.org`
    }

    return loginOrSignup(userData)
    .then(parseCookie)
    .then(API.getUserWithCookie)
    .then(tap(setCustomData(customData)))
    .then(refreshUser)
  },

  createAdminUser: data => {
    return API.createUser(data)
    .then(tap(user => makeUserAdmin(user._id)))
  },

  getUserWithCookie: cookie => {
    return request('get', '/api/user', null, cookie)
    .then(user => {
      user.cookie = cookie
      return user
    })
  },

  getRefreshedUser: async userPromise => {
    // Also accept already resolved user docs with their cookie
    if (userPromise._id && userPromise.cookie) userPromise = Promise.resolve(userPromise)
    const user = await userPromise
    // Get the up-to-date user doc while keeping the cookie
    // set by tests/api/fixtures/users
    return API.getUserWithCookie(user.cookie)
  },

  createUsername: () => {
    // Add a random string to prevent creating several users with the same username
    // and be rejected because of it
    return faker.fake('{{name.firstName}}').replace(/\W/, '') + randomString(2)
  },

  createUserEmail: () => faker.internet.email(),

  getUsersWithoutRelation: () => {
    return Promise.all([
      getUser(),
      getReservedUser()
    ])
    .then(([ userA, userB ]) => ({ userA, userB }))
  },

  getTwoFriends: () => {
    twoFriendsPromise = twoFriendsPromise || getTwoFriends()
    return twoFriendsPromise
  }
}

const getTwoFriends = () => {
  return Promise.all([
    getUser(),
    getReservedUser()
  ])
  .then(([ userA, userB ]) => {
    return makeFriends(userA, userB)
    .then(() => [ userA, userB ])
  })
}

const parseCookie = res => res.headers['set-cookie']

const setCustomData = customData => user => {
  delete customData.username

  // Make updates sequentially to avoid update conflicts
  let sequentialUpdate = Promise.resolve()

  for (const attribute in customData) {
    const value = customData[attribute]
    sequentialUpdate = sequentialUpdate
      .then(() => setUserAttribute(user, attribute, value))
  }

  return sequentialUpdate
}

const setUserAttribute = (user, attribute, value) => {
  return request('put', '/api/user', { attribute, value }, user.cookie)
}

const refreshUser = user => API.getUserWithCookie(user.cookie)
