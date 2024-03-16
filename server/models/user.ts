import { get, omit, pick, without } from 'lodash-es'
import { hashPassword } from '#lib/crypto'
import { newError } from '#lib/error/error'
import { newInvalidError } from '#lib/error/pre_filled'
import { truncateLatLng } from '#lib/geo'
import { assert_ } from '#lib/utils/assert_types'
import { normalizeString } from '#lib/utils/base'
import { log } from '#lib/utils/logs'
import { getRandomString } from '#lib/utils/random_string'
import type { StringifiedHashedSecretData } from '#types/common'
import type { User, CreationStrategy, Email, DeletedUser } from '#types/user'
import userAttributes from './attributes/user.js'
import userValidations from './validations/user.js'

const generateReadToken = getRandomString.bind(null, 32)

// TODO: remove the last traces of creationStrategy=browserid: optional password
export async function createUserDoc (username: string, email: Email, creationStrategy: CreationStrategy, language: string, password: string) {
  log([ username, email, creationStrategy, language, `password:${(password != null)}` ], 'creating user')
  assert_.strings([ username, email, creationStrategy ])
  if (language != null) { assert_.string(language) }

  username = userFormatters.username(username)

  userValidations.pass('username', username)
  userValidations.pass('email', email)
  userValidations.pass('creationStrategy', creationStrategy)

  // it's ok to have an undefined language
  if (language && !userValidations.language(language)) {
    throw newInvalidError('language', language)
  }

  const user: Partial<User> = {
    username,
    email,
    type: 'user',
    created: Date.now(),
    creationStrategy,
    language,
    settings: {},
    // A token that, when combined with the right user id,
    // gives access to all the resources the user can read
    // Use case:
    // - private RSS feeds
    // This token can be passed in a URL with the following considerations in mind
    // http://stackoverflow.com/a/643480/3324977
    readToken: generateReadToken(),
    // Snapshot data by visibility
    snapshot: {
      private: { 'items:count': 0 },
      network: { 'items:count': 0 },
      public: { 'items:count': 0 },
    },
  }

  if (creationStrategy === 'local') {
    user.validEmail = false
    if (!userValidations.password(password)) {
      // Do NOT pass the password as context, as it would be logged
      // and returned in the response
      throw newError('invalid password', 400)
    }
    user.password = password
  } else {
    throw newError('unknown strategy', 400)
  }

  await hashUserPassword(user)

  return user
}

const hashUserPassword = async user => {
  const { password } = user
  if (password != null) {
    const hash = await hashPassword(password)
    user.password = hash
  }
}

export async function upgradeInvitedUser (invitedDoc, username, creationStrategy, language, password) {
  const { email } = invitedDoc
  const userDoc = await createUserDoc(username, email, creationStrategy, language, password)
  // Will override type but keep inviters and inviting groups
  return Object.assign(invitedDoc, userDoc)
}

export function softDeleteUser (userDoc: User) {
  const userSouvenir: DeletedUser = {
    ...pick(userDoc, userAttributes.critical),
    type: 'deletedUser',
    deleted: Date.now(),
  }
  return userSouvenir
}

export function updateUserDocEmail (doc, email) {
  if (email !== doc.email) {
    doc.email = email
    doc.validEmail = false
  }
  return doc
}

export function updateUserDocPassword (user: User, newHash: StringifiedHashedSecretData) {
  user.password = newHash
  user = omit(user, 'resetPassword')
  // Unlocking password-related functionalities on client-side
  // for users originally created with browserid if they ask for a password reset
  if (user.creationStrategy === 'browserid') { user.hasPassword = true }
  // Also change the read token, following Github practice
  // https://github.com/blog/16-token-private-feeds
  user.readToken = generateReadToken()
  return user
}

export const setUserDocOauthTokens = (provider, data) => user => {
  assert_.string(provider)
  assert_.object(data)
  assert_.string(data.token)
  assert_.string(data.token_secret)
  user.oauth = user.oauth || {}
  user.oauth[provider] = data
  return user
}

export const updateUserItemsCounts = itemsCounts => user => {
  // This function is used by db.update and should thus always return a user doc
  // even if unmodified
  if (user.type === 'deletedUser') return user
  assert_.object(itemsCounts.private)
  assert_.object(itemsCounts.network)
  assert_.object(itemsCounts.public)
  Object.assign(user.snapshot, itemsCounts)
  return user
}

export const addUserDocRole = role => user => {
  if (!userAttributes.roles.includes(role)) {
    throw newError('unknown role', 400)
  }
  user.roles = user.roles || []
  if (user.roles.includes(role)) {
    throw newError('user already has role', 400)
  }
  user.roles.push(role)
  return user
}

export const removeUserDocRole = role => user => {
  if (!userAttributes.roles.includes(role)) {
    throw newError('unknown role', 400)
  }
  user.roles = user.roles || []
  user.roles = without(user.roles, role)
  return user
}

// We need a stable username for services that use the username as unique user id
// such as wiki.inventaire.io (https://github.com/inventaire/inventaire-mediawiki)
export function setUserDocStableUsername (user) {
  user.stableUsername = user.stableUsername || user.username
  return user
}

export function userShouldBeAnonymized (user) {
  const userSetting = get(user, 'settings.contributions.anonymize')
  return userSetting !== false
}

export const userFormatters = {
  username: normalizeString,
  position: truncateLatLng,
}
