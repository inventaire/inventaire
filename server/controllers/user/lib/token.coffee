CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
radio = __.require 'lib', 'radio'
User = __.require 'models', 'user'
error_ = __.require 'lib', 'error/error'
pw_ = __.require('lib', 'crypto').passwords
{ tokenDaysToLive } = CONFIG
{ WrappedUpdater } = __.require 'lib', 'doc_updates'
randomString = __.require 'lib', 'utils/random_string'
testToken = pw_.verify

module.exports = (db, user_)->

  wrappedUpdate = WrappedUpdater db

  token_ = {}

  token_.sendValidationEmail = (user)->
    if user.validEmail
      log = _.pick user, ['_id', 'creationStrategy']
      _.warn log, 'email was already validated'
      return user

    getTokenData()
    .then (tokenData)->
      [ token, tokenHash ] = tokenData
      radio.emit 'validation:email', user, token
      wrappedUpdate user._id, 'emailValidation', tokenHash
      return user

  token_.confirmEmailValidity = (email, token)->
    user_.findOneByEmail email
    .then updateIfValidToken.bind(null, token)
    .catch (err)->
      if err.notFound then throw noEmailValidationFound token, email
      else throw err

  updateIfValidToken = (token, user)->
    { emailValidation, _id } = user
    unless emailValidation?
      throw noEmailValidationFound token, _id

    testToken emailValidation, token, tokenDaysToLive
    .then updateValidEmail.bind(null, db, _id)

  noEmailValidationFound = (context...)->
    error_.new 'no email validation token found', 401, context

  token_.sendResetPasswordEmail = (user)->
    getTokenData()
    .then (tokenData)->
      [ token, tokenHash ] = tokenData
      radio.emit 'reset:password:email', user, token
      wrappedUpdate user._id, 'token', tokenHash
      return user

  token_.openPasswordUpdateWindow = (user)->
    db.update user._id, (doc)->
      doc.token = null
      doc.resetPassword = Date.now()
      return doc

  return token_

updateValidEmail = (db, _id, valid)->
  if valid then db.update _id, emailIsValid
  else throw error_.new 'token is invalid or expired', 401, _id

emailIsValid = (user)->
  user.validEmail = true
  return _.omit user, 'emailValidation'

getTokenData = ->
  token = randomString 32
  pw_.hash token
  .then (tokenHash)->
    return [ token, tokenHash ]
