import 'should'
import { randomBytes } from 'node:crypto'
import { isPlainObject, random, round } from 'lodash-es'
import { addUserRole } from '#controllers/user/lib/user'
import { getSomeEmail, getSomeUsername } from '#fixtures/text'
import { assert_ } from '#lib/utils/assert_types'
import { getRandomString } from '#lib/utils/random_string'
import CONFIG from '#server/config'
import { makeFriends } from '../utils/relations.js'
import { request, rawRequest } from '../utils/request.js'

const origin = CONFIG.getLocalOrigin()
const authEndpoint = `${origin}/api/auth`

let getUser, updateUser
const importCircularDependencies = async () => {
  ;({ getUser } = await import('../utils/utils.js'))
  ;({ updateUser } = await import('../utils/users.js'))
}
setImmediate(importCircularDependencies)

const connect = (endpoint, userData) => rawRequest('post', endpoint, { body: userData })
const _signup = userData => connect(`${authEndpoint}?action=signup`, userData)
const loginOrSignup = async userData => {
  try {
    return await connect(`${authEndpoint}?action=login`, userData)
  } catch (err) {
    if (err.statusCode !== 401) throw err
    return _signup(userData)
  }
}

export function signup (email) {
  return _signup({
    email,
    username: createUsername(),
    password: randomBytes(8).toString('base64'),
  })
}

async function _getOrCreateUser ({ customData = {}, mayReuseExistingUser, role }) {
  const username = customData.username || createUsername()
  const userData = {
    username,
    password: customData.password || '12345678',
    email: `${getRandomString(10)}@adomain.org`,
    language: customData.language || 'en',
  }
  let cookie
  if (mayReuseExistingUser) {
    cookie = await loginOrSignup(userData).then(parseCookie)
  } else {
    cookie = await _signup(userData).then(parseCookie)
  }
  assert_.string(cookie)
  const user = await getUserWithCookie(cookie)
  await setCustomData(user, customData)
  if (role) await addUserRole(user._id, role)
  return getUserWithCookie(cookie)
}

export function getOrCreateUser (customData, role) {
  return _getOrCreateUser({ customData, role, mayReuseExistingUser: true })
}

export function createUser (customData = {}) {
  return _getOrCreateUser({ customData, mayReuseExistingUser: false })
}

export async function getUserWithCookie (cookie) {
  const user = await request('get', '/api/user', null, cookie)
  user.cookie = cookie
  assert_.string(user.cookie)
  return user
}

export async function getRefreshedUser (user) {
  // Allow to pass either a user doc or a user promise
  user = await user
  // Get the up-to-date user doc while keeping the cookie
  // set by tests/api/fixtures/users
  return getUserWithCookie(user.cookie)
}

export const createUsername = () => getSomeUsername()

export const createUserEmail = () => getSomeEmail()

export const getUsersWithoutRelation = async () => {
  const [ userA, userB ] = await Promise.all([
    getUser(),
    createUser(),
  ])
  return { userA, userB }
}

export const getRandomPosition = () => {
  return [
    getRandomLatitude(),
    getRandomLongitude(),
  ]
}
export const getRandomLatitude = () => randomCoordinate(-90, 90)
export const getRandomLongitude = () => randomCoordinate(-180, 180)

export async function getTwoFriends () {
  const [ userA, userB ] = await Promise.all([
    getUser(),
    createUser(),
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
    if (isPlainObject(value)) {
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
  return round(random(min, max, true), 4)
}
