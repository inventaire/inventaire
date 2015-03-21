CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
pw_ = __.require('lib', 'crypto').passwords
promises_ = __.require 'lib', 'promises'
gravatar = require 'gravatar'
uuid = require 'simple-uuid'
error_ = __.require 'lib', 'error/error'

module.exports = User = {}

User.tests = tests = require './tests/user'

# should always return a promise
# thus the try/catch returning error in a rejected promise
User.create = (username, email, creationStrategy, password)->
  _.log [username, email, creationStrategy, "password:#{password?}"], 'creating user'
  try
    _.types arguments, ['string', 'string', 'string', 'string|undefined'], 3

    unless tests.username(username)
      throw error_.new "invalid username: #{username}", 400

    unless tests.email(email)
      throw error_.new "invalid email: #{email}", 400

    unless tests.creationStrategy(creationStrategy)
      throw error_.new "invalid creationStrategy: #{creationStrategy}", 400

    user =
      username: username
      email: email
      type: 'user'
      created: Date.now()
      creationStrategy: creationStrategy
      # gravatar params: {d: default image, s: size}
      picture: gravatar.url(email, {d: 'mm', s: '200'})

    switch creationStrategy
      when 'local'
        user.validEmail = false
        user.emailValidation = getEmailValidationData()
        unless tests.password(password)
          throw error_.new 'invalid password'
        user.password = password
      when 'browserid'
        user.validEmail = true
        # user can be created with a password when using
        # browserid authentification
        if password?
          throw error_.new 'shouldnt have a password'

    return withHashedPassword(user)

  catch err
    _.error err, 'User create err'
    return promises_.reject(err)

withHashedPassword = (user)->
  {password} = user
  if password?
    return pw_.hash(password).then replacePassword.bind(null, user)
  else
    return promises_.resolve(user)

replacePassword = (user, hash)->
  user.password = hash
  return user

User.getEmailValidationData = getEmailValidationData = ->
  token: uuid()
  timestamp: _.now()

User.attributes = require './attributes/user'
