import 'should'
import { randomBytes } from 'node:crypto'
import CONFIG from 'config'
import _ from '#builders/utils'
import { addUserRole } from '#controllers/user/lib/user'
import { assert_ } from '#lib/utils/assert_types'
import { getRandomString } from '#lib/utils/random_string'
import { makeFriends } from '../utils/relations.js'
import { request, rawRequest } from '../utils/request.js'
import fakeText from './text.js'

const origin = CONFIG.getLocalOrigin()
const authEndpoint = `${origin}/api/auth`
let twoFriendsPromise

let getUser, getReservedUser, updateUser
const importCircularDependencies = async () => {
  ;({ getUser, getReservedUser } = await import('../utils/utils.js'))
  ;({ updateUser } = await import('../utils/users.js'))
}
setImmediate(importCircularDependencies)

const connect = (endpoint, userData) => rawRequest('post', endpoint, { body: userData })
const signup = userData => connect(`${authEndpoint}?action=signup`, userData)
const loginOrSignup = async userData => {
  try {
    return await connect(`${authEndpoint}?action=login`, userData)
  } catch (err) {
    if (err.statusCode !== 401) throw err
    return signup(userData)
  }
}

const API = {
  signup: email => {
    return signup({
      email,
      username: API.createUsername(),
      password: randomBytes(8).toString('base64'),
    })
  },

  createUser: async (customData = {}, role) => {
    const username = customData.username || API.createUsername()
    const userData = {
      username,
      password: customData.password || '12345678',
      email: `${getRandomString(10)}@adomain.org`,
      language: customData.language || 'en',
    }

    const cookie = await loginOrSignup(userData).then(parseCookie)
    assert_.string(cookie)
    const user = await API.getUserWithCookie(cookie)
    await setCustomData(user, customData)
    if (role) await addUserRole(user._id, role)
    return API.getUserWithCookie(cookie)
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
    return fakeText.username()
  },

  createUserEmail: () => fakeText.email(),

  getUsersWithoutRelation: async () => {
    const [ userA, userB ] = await Promise.all([
      getUser(),
      getReservedUser(),
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
  },
}

export default API

const getTwoFriends = async () => {
  const [ userA, userB ] = await Promise.all([
    getUser(),
    getReservedUser(),
  ])
  await makeFriends(userA, userB)
  return [ userA, userB ]
}

const parseCookie = res => res.headers['set-cookie']

const setCustomData = async (user, customData) => {
  delete customData.username
  delete customData.password
  for (const attribute in customData) {
    const value = customData[attribute]
    if (_.isPlainObject(value)) {
      // ex: 'settings.contributions.anonymize': false
      throw new Error('use object path syntax')
    }
    await updateUser({ user, attribute, value })
  }
}

const randomCoordinate = (min, max) => {
  // Let some margin so that no invalid coordinates can be generated
  // from adding/removing less than 5 from any random coordinate composant
  min = min + 5
  max = max - 5
  return _.round(_.random(min, max, true), 4)
}
