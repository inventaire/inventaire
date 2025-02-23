import 'should'
import { randomBytes } from 'node:crypto'
import { isPlainObject, random, round } from 'lodash-es'
import { red } from 'tiny-chalk'
import { addUserRole } from '#controllers/user/lib/user'
import { getSomeEmail, getSomeUsername } from '#fixtures/text'
import { getRandomUuid } from '#lib/crypto'
import { assertString } from '#lib/utils/assert_types'
import { logError, success } from '#lib/utils/logs'
import { getRandomString } from '#lib/utils/random_string'
import { shellExec } from '#scripts/scripts_utils'
import { federatedMode, localOrigin, remoteEntitiesOrigin } from '#server/config'
import { makeFriends } from '#tests/api/utils/relations'
import { request, rawRequest } from '#tests/api/utils/request'
import type { Awaitable } from '#tests/api/utils/types'
import { deleteUser } from '#tests/api/utils/users'
import type { LatLng, Origin } from '#types/common'
import type { User, UserId, UserRole } from '#types/user'

export type CustomUserData = Record<string, string | number | boolean | number[]>

const authEndpoint = '/api/auth'

let getUser, updateUser
async function importCircularDependencies () {
  ;({ getUser } = await import('#tests/api/utils/utils'))
  ;({ updateUser } = await import('#tests/api/utils/users'))
}
setImmediate(importCircularDependencies)

const connect = (endpoint, userData) => rawRequest('post', endpoint, { body: userData })

function _signup (userData, origin: Origin = localOrigin) {
  return connect(`${origin}${authEndpoint}?action=signup`, userData)
}

async function loginOrSignup (userData, origin = localOrigin) {
  try {
    return await connect(`${origin}${authEndpoint}?action=login`, userData)
  } catch (err) {
    if (err.statusCode !== 401) throw err
    return _signup(userData, origin)
  }
}

export function signup (email) {
  return _signup({
    email,
    username: createUsername(),
    password: randomBytes(8).toString('base64'),
  })
}

async function _getOrCreateUser ({ customData = {}, mayReuseExistingUser, role, origin }: { customData: CustomUserData, mayReuseExistingUser?: boolean, role?: UserRole, origin?: Origin }) {
  const username = customData.username || createUsername()
  const userData = {
    username,
    password: customData.password || '12345678',
    email: `${getRandomString(10)}@adomain.org`,
    language: customData.language || 'en',
  }
  let cookie
  if (mayReuseExistingUser) {
    cookie = await loginOrSignup(userData, origin).then(parseCookie)
  } else {
    cookie = await _signup(userData, origin).then(parseCookie)
  }
  assertString(cookie)
  const user = await getUserWithCookie(cookie, origin)
  await setCustomData(user, customData, origin)
  if (role) {
    await addTestUserRole(user._id, role, origin)
  }
  return getUserWithCookie(cookie, origin)
}

async function addTestUserRole (userId: UserId, role: UserRole, origin: Origin) {
  if (federatedMode && origin === remoteEntitiesOrigin) {
    // Use a sub-process to use be able to override NODE_ENV and NODE_APP_INSTANCE to access the associated config
    try {
      const { stderr } = await shellExec(`export NODE_ENV=tests-api NODE_APP_INSTANCE=server; npm run db-actions:update-user-role ${userId} add ${role}`)
      if (stderr) console.log(red('addTestUserRole stderr ###'), stderr, red('###'))
      else success(`added role ${role} to ${userId}`)
    } catch (err) {
      logError(err)
      throw err
    }
  } else {
    await addUserRole(userId, role)
  }
}

export function getOrCreateUser (customData: CustomUserData, role: UserRole, origin?: Origin) {
  return _getOrCreateUser({ customData, role, mayReuseExistingUser: true, origin })
}

export function createUser (customData: CustomUserData = {}) {
  return _getOrCreateUser({ customData, mayReuseExistingUser: false })
}

export interface UserWithCookie extends User {
  cookie: string
  origin: Origin
}

export type AwaitableUserWithCookie = Awaitable<UserWithCookie>

export async function getUserWithCookie (cookie: string, origin: Origin = localOrigin) {
  const user = await request('get', `${origin}/api/user`, null, { cookie })
  user.cookie = cookie
  user.origin = origin
  assertString(user.cookie)
  return user as UserWithCookie
}

export async function getRefreshedUser (user: AwaitableUserWithCookie, origin?: Origin) {
  // Allow to pass either a user doc or a user promise
  user = await user
  // Get the up-to-date user doc while keeping the cookie
  // set by tests/api/fixtures/users
  return getUserWithCookie(user.cookie, origin)
}

export const createUsername = () => getSomeUsername()

export const createUserEmail = () => getSomeEmail()

export async function getUsersWithoutRelation () {
  const [ userA, userB ] = await Promise.all([
    getUser(),
    createUser(),
  ])
  return { userA, userB }
}

export function getRandomPosition () {
  return [
    getRandomLatitude(),
    getRandomLongitude(),
  ] as LatLng
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

async function setCustomData (user: UserWithCookie, customData: CustomUserData, origin: Origin = localOrigin) {
  delete customData.username
  delete customData.password
  for (const attribute in customData) {
    const value = customData[attribute]
    if (isPlainObject(value)) {
      // ex: 'settings.contributions.anonymize': false
      throw new Error('use object path syntax')
    }
    await updateUser({ user, attribute, value, origin })
  }
}

function randomCoordinate (min: number, max: number) {
  // Let some margin so that no invalid coordinates can be generated
  // from adding/removing less than 5 from any random coordinate composant
  min = min + 5
  max = max - 5
  return round(random(min, max, true), 4)
}

export const someSpamText = 'SEO! https://spamers.corp'

export async function getDeletedUser () {
  const user = await createUser()
  await deleteUser(user)
  return getRefreshedUser(user)
}

export const getSomeRandomAnonymizableId = getRandomUuid
