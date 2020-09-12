const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const pw_ = __.require('lib', 'crypto').passwords
const assert_ = __.require('utils', 'assert_types')
const error_ = __.require('lib', 'error/error')
const randomString = __.require('lib', 'utils/random_string')
const generateReadToken = randomString.bind(null, 32)
const { truncateLatLng } = __.require('lib', 'geo')

const User = module.exports = {}

const validations = User.validations = require('./validations/user')

// TODO: remove the last traces of creationStrategy=browserid: optional password
User._create = (username, email, creationStrategy, language, password) => {
  _.log([ username, email, creationStrategy, language, `password:${(password != null)}` ], 'creating user')
  assert_.strings([ username, email, creationStrategy ])
  if (language != null) { assert_.string(language) }

  validations.pass('username', username)
  validations.pass('email', email)
  validations.pass('creationStrategy', creationStrategy)

  // it's ok to have an undefined language
  if (language && !validations.language(language)) {
    throw error_.newInvalid('language', language)
  }

  const user = {
    username,
    email,
    type: 'user',
    created: Date.now(),
    creationStrategy,
    language,
    settings: { notifications: {} },
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
      public: { 'items:count': 0 }
    }
  }

  if (creationStrategy === 'local') {
    user.validEmail = false
    if (!validations.password(password)) {
      // Do NOT pass the password as context, as it would be logged
      // and returned in the response
      throw error_.new('invalid password', 400)
    }
    user.password = password
  } else {
    throw error_.new('unknown strategy', 400)
  }

  return user
}

User.create = async (...args) => {
  const user = User._create.apply(null, args)
  return withHashedPassword(user)
}

User.upgradeInvited = (invitedDoc, username, creationStrategy, language, password) => {
  const { email } = invitedDoc
  return User.create(username, email, creationStrategy, language, password)
  // Will override type but keep inviters and inviting groups
  .then(userDoc => Object.assign(invitedDoc, userDoc))
}

const withHashedPassword = async user => {
  const { password } = user
  if (password != null) {
    const hash = await pw_.hash(password)
    user.password = hash
  }
  return user
}

User.attributes = require('./attributes/user')

User.softDelete = userDoc => {
  const userSouvenir = _.pick(userDoc, User.attributes.critical)
  userSouvenir.type = 'deletedUser'
  return userSouvenir
}

User.updateEmail = (doc, email) => {
  doc.email = email
  return doc
}

User.updatePassword = (user, newHash) => {
  user.password = newHash
  user = _.omit(user, 'resetPassword')
  // Unlocking password-related functionalities on client-side
  // for users originally created with browserid if they ask for a password reset
  if (user.creationStrategy === 'browserid') { user.hasPassword = true }
  // Also change the read token, following Github practice
  // https://github.com/blog/16-token-private-feeds
  user.readToken = generateReadToken()
  return user
}

User.setOauthTokens = (provider, data) => user => {
  assert_.string(provider)
  assert_.object(data)
  assert_.string(data.token)
  assert_.string(data.token_secret)
  user.oauth = user.oauth || {}
  user.oauth[provider] = data
  return user
}

User.updateItemsCounts = itemsCounts => user => {
  // This function is used by db.update and should thus always return a user doc
  // even if unmodified
  if (user.type === 'deletedUser') return user
  assert_.object(itemsCounts.private)
  assert_.object(itemsCounts.network)
  assert_.object(itemsCounts.public)
  Object.assign(user.snapshot, itemsCounts)
  return user
}

User.addRole = (user, role) => {
  if (!User.attributes.roles.includes(role)) {
    throw error_.new('unknown role', 400)
  }
  user.roles = user.roles || []
  if (user.roles.includes(role)) {
    throw error_.new('user already has role', 400)
  }
  user.roles.push(role)
  return user
}

User.removeRole = (user, role) => {
  if (!User.attributes.roles.includes(role)) {
    throw error_.new('unknown role', 400)
  }
  user.roles = user.roles || []
  user.roles = _.without(user.roles, role)
  return user
}

User.formatters = {
  position: truncateLatLng
}
