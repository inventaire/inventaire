CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
pw_ = __.require('lib', 'crypto').passwords
promises_ = __.require 'lib', 'promises'
gravatar = require 'gravatar'
error_ = __.require 'lib', 'error/error'

module.exports = User = {}

User.tests = tests = require './tests/user'

# should always return a promise
# thus the try/catch returning error in a rejected promise
User.create = (username, email, creationStrategy, language, password)->
  _.log [username, email, creationStrategy, language, "password:#{password?}"], 'creating user'
  _.types arguments, ['string', 'string', 'string', 'string|undefined', 'string|undefined'], 3

  tests.pass 'username', username
  tests.pass 'email', email
  tests.pass 'creationStrategy', creationStrategy

  # it's ok to have an undefined language
  if language? and not tests.language(language)
    throw error_.new "invalid language: #{language}", 400


  user =
    username: username
    email: email
    type: 'user'
    created: Date.now()
    creationStrategy: creationStrategy
    language: language
    # gravatar params: email, options={d: default image, s: size}, https
    picture: gravatar.url(email, {d: 'mm', s: '500'}, true)
    settings:
      notifications: {}

  switch creationStrategy
    when 'local'
      user.validEmail = false
      unless tests.password(password)
        throw error_.new 'invalid password', 400
      user.password = password
    when 'browserid'
      user.validEmail = true
      # user can be created with a password when using
      # browserid authentification
      if password?
        throw error_.new 'shouldnt have a password'

  return withHashedPassword(user)

User.upgradeInvited = (invitedDoc, username, creationStrategy, language, password)->
  { email } = invitedDoc
  User.create username, email, creationStrategy, language, password
  .then (userDoc)->
    # will override type but keep inviters
    _.extend invitedDoc, userDoc

withHashedPassword = (user)->
  {password} = user
  if password?
    return pw_.hash(password).then replacePassword.bind(null, user)
  else
    return promises_.resolve(user)

replacePassword = (user, hash)->
  user.password = hash
  return user


User.attributes = require './attributes/user'

User.softDelete = (userDoc)->
  userSouvenir = _.pick userDoc, User.attributes.critical
  userSouvenir.type = 'deletedUser'
  return userSouvenir
