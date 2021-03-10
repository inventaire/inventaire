const CONFIG = require('config')
const _ = require('builders/utils')
require('should')
const assert_ = require('lib/utils/assert_types')
const host = CONFIG.fullHost()
const authEndpoint = `${host}/api/auth`
const faker = require('faker')
const { addRole } = require('controllers/user/lib/user')
const { request, rawRequest } = require('../utils/request')
const { makeFriends } = require('../utils/relations')
const randomString = require('lib/utils/random_string')
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

  createUser: async (customData = {}, role) => {
    const username = customData.username || API.createUsername()
    const userData = {
      username,
      password: '12345678',
      email: `${username}@adomain.org`,
      language: customData.language || 'en'
    }

    const cookie = await loginOrSignup(userData).then(parseCookie)
    assert_.string(cookie)
    const user = await API.getUserWithCookie(cookie)
    await setCustomData(user, customData)
    if (role) await addRole(user._id, role)
    return refreshUser(cookie)
  },

  getUserWithCookie: async cookie => {
    const user = await request('get', '/api/user', null, cookie)
    user.cookie = cookie
    assert_.string(user.cookie)
    return user
  },

  getRefreshedUser: async user => {
    // Allow to pass either a user doc or a user promise
    user = await user
    // Get the up-to-date user doc while keeping the cookie
    // set by tests/api/fixtures/users
    return API.getUserWithCookie(user.cookie)
  },

  createUsername: () => {
    // Add a random string to prevent creating several users with the same username
    // and be rejected because of it
    return faker.fake('{{name.firstName}}').replace(/\W/, '') + randomString(4)
  },

  createUserEmail: () => faker.internet.email(),

  getUsersWithoutRelation: async () => {
    const [ userA, userB ] = await Promise.all([
      getUser(),
      getReservedUser()
    ])
    return { userA, userB }
  },

  getTwoFriends: () => {
    twoFriendsPromise = twoFriendsPromise || getTwoFriends()
    return twoFriendsPromise
  },

  getRandomPosition: () => {
    return [
      // Latitude
      randomCoordinate(-90, 90),
      // Longitude
      randomCoordinate(-180, 180),
    ]
  }
}

const getTwoFriends = async () => {
  const [ userA, userB ] = await Promise.all([
    getUser(),
    getReservedUser()
  ])
  await makeFriends(userA, userB)
  return [ userA, userB ]
}

const parseCookie = res => res.headers['set-cookie']

const setCustomData = async (user, customData) => {
  delete customData.username
  for (const attribute in customData) {
    const value = customData[attribute]
    await setUserAttribute(user, attribute, value)
  }
}

const setUserAttribute = (user, attribute, value) => {
  return request('put', '/api/user', { attribute, value }, user.cookie)
}

const refreshUser = API.getUserWithCookie

const randomCoordinate = (min, max) => {
  // Let some margin so that no invalid coordinates can be generated
  // from adding/removing less than 5 from any random coordinate composant
  min = min + 5
  max = max - 5
  return _.round(_.random(min, max, true), 4)
}
