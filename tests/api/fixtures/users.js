const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { Promise } = __.require('lib', 'promises')
const host = CONFIG.fullHost()
const authEndpoint = `${host}/api/auth`
const faker = require('faker')
const { makeUserAdmin } = __.require('controllers', 'user/lib/user')
const { request, rawRequest } = require('../utils/request')
const randomString = __.require('lib', './utils/random_string')

const connect = (endpoint, userData) => rawRequest('post', { url: endpoint, body: userData })
const signup = userData => connect(`${authEndpoint}?action=signup`, userData)
const login = userData => connect(`${authEndpoint}?action=login`, userData)
.catch(err => {
  if (err.statusCode !== 401) throw err
  return signup(userData)
})

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

    // Try to login first if the username is given, as a user with this username
    // might still exist if the database wasn't reset since the last test session
    const authPromise = (username != null) ? login(userData) : signup(userData)

    return authPromise
    .then(parseCookie)
    .then(API.getUserWithCookie)
    .tap(setCustomData(customData))
    .then(refreshUser)
  },

  createAdminUser: data => {
    return API.createUser(data)
    .tap(user => makeUserAdmin(user._id))
  },

  getUserWithCookie: cookie => {
    return request('get', '/api/user', null, cookie)
    .then(user => {
      user.cookie = cookie
      return user
    })
  },

  getRefreshedUser: userPromise => {
    return userPromise
    // Get the up-to-date user doc while keeping the cookie
    // set by tests/api/fixtures/users
    .then(user => API.getUserWithCookie(user.cookie))
  },

  createUsername: () => {
    // Add a random string to prevent creating several users with the same username
    // and be rejected because of it
    return faker.fake('{{name.firstName}}').replace(/\W/, '') + randomString(2)
  }
}

const parseCookie = res => res.headers['set-cookie'].join(';')

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

const setUserAttribute = (user, attribute, value) => request('put', '/api/user', { attribute, value }, user.cookie)

const refreshUser = user => API.getUserWithCookie(user.cookie)
