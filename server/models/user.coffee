CONFIG = require 'config'
__ = CONFIG.root
{tokenTtl} = CONFIG
_ = __.require 'builders', 'utils'
pw_ = __.require('lib', 'crypto').passwords
promises_ = __.require 'lib', 'promises'
{Username, Email} = require './common-tests'
gravatar = require 'gravatar'
uuid = require 'simple-uuid'


module.exports = User =
  # should always return a promise
  # thus the try/catch returning error in a rejected promise
  create: (username, email, creationStrategy, password)->
    _.log [username, email, creationStrategy, "password:#{password?}"], 'creating user'
    try
      _.types arguments, ['string', 'string', 'string', 'string|undefined'], 3

      unless validUsername(username)
        throw new Error "invalid username: #{username}"

      unless validEmail(email)
        throw new Error "invalid email: #{email}"

      unless validStrategy(creationStrategy)
        throw new Error "invalid creationStrategy: #{creationStrategy}"

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
          user.validatedEmail = false
          user.emailValidation = getEmailValidationData()
          unless validPassword(password)
            throw new Error "invalid password"
          user.password = password
        when 'browserid'
          user.validatedEmail = true
          # user can be created with a password when using
          # browserid authentification
          if password?
            throw new Error "shouldnt have a password"

      return withHashedPassword(user)

    catch err
      _.error err, 'User create err'
      return promises_.reject(err)

User.validUsername = validUsername = (username)-> Username.test(username)
User.validEmail = validEmail = (username)-> Email.test(username)
validPassword = (password)->  8 <= password.length <=60
validStrategy = (creationStrategy)-> creationStrategy in ['browserid', 'local']

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

User.validToken = (token, emailValidation)->
  _.types arguments, ['string', 'object']
  _.log('validToken arguments', arguments)
  return false  if _.expired(emailValidation.timestamp, tokenTtl)
  return false  if token isnt emailValidation.token
  return true

User.tests =
  username: validUsername
  email: validEmail
  language: (lang)-> /^\w{2}$/.test(lang)
  picture: (picture)-> _.isUrl(picture)


User.attributes = {}

# attributes that can be send to the owner
User.attributes.ownerSafe = [
    '_id'
    '_rev'
    'username'
    'email'
    'picture'
    'language'
    'creationStrategy'
    'validatedEmail'
  ]

# attributes that need availability check before update
User.attributes.concurrencial = [
  'username'
  'email'
]

# attributes that can be changed with a simple validity check
User.attributes.updatable = [
  'picture'
  'language'
]