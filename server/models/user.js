const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const pw_ = __.require('lib', 'crypto').passwords
const promises_ = __.require('lib', 'promises')
const assert_ = __.require('utils', 'assert_types')
const gravatar = __.require('lib', 'gravatar')
const error_ = __.require('lib', 'error/error')
const randomString = __.require('lib', 'utils/random_string')
const generateReadToken = randomString.bind(null, 32)

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
  if ((language != null) && !validations.language(language)) {
    throw error_.newInvalid('language', language)
  }

  const user = {
    username,
    email,
    type: 'user',
    created: Date.now(),
    creationStrategy,
    language,
    picture: gravatar(email),
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

  switch (creationStrategy) {
  case 'local':
    user.validEmail = false
    if (!validations.password(password)) {
      // Do NOT pass the password as context, as it would be logged
      // and returned in the response
      throw error_.new('invalid password', 400)
    }
    user.password = password
    break
  default:
    throw error_.new('unknown strategy', 400)
  }

  return user
}

User.create = (...args) => promises_.try(() => User._create.apply(null, args))
.then(withHashedPassword)

User.upgradeInvited = (invitedDoc, username, creationStrategy, language, password) => {
  const { email } = invitedDoc
  return User.create(username, email, creationStrategy, language, password)
  // Will override type but keep inviters and inviting groups
  .then(userDoc => Object.assign(invitedDoc, userDoc))
}

const withHashedPassword = user => {
  const { password } = user
  if (password != null) {
    return pw_.hash(password).then(replacePassword.bind(null, user))
  } else {
    return promises_.resolve(user)
  }
}

const replacePassword = (user, hash) => {
  user.password = hash
  return user
}

User.attributes = require('./attributes/user')

User.softDelete = userDoc => {
  const userSouvenir = _.pick(userDoc, User.attributes.critical)
  userSouvenir.type = 'deletedUser'
  return userSouvenir
}

User.updateEmail = (doc, email) => {
  doc = archivePreviousEmail(doc)
  doc.email = email
  return doc
}

const archivePreviousEmail = doc => {
  // Don't save the previous email if it had not been validated
  if (doc.validEmail) {
    if (!doc.previousEmails) { doc.previousEmails = [] }
    doc.previousEmails.push(doc.email)
    doc.previousEmails = _.uniq(doc.previousEmails)
    doc.validEmail = false
  }
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
  if (!user.oauth) { user.oauth = {} }
  user.oauth[provider] = data
  return user
}

User.updateItemsCounts = itemsCounts => user => {
  assert_.object(itemsCounts.private)
  assert_.object(itemsCounts.network)
  assert_.object(itemsCounts.public)
  Object.assign(user.snapshot, itemsCounts)
  return user
}
