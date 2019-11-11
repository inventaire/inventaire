// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const radio = __.require('lib', 'radio')
const User = __.require('models', 'user')
const error_ = __.require('lib', 'error/error')
const pw_ = __.require('lib', 'crypto').passwords
const { tokenDaysToLive } = CONFIG
const { WrappedUpdater } = __.require('lib', 'doc_updates')
const randomString = __.require('lib', 'utils/random_string')
const testToken = pw_.verify

module.exports = function(db, user_){

  const wrappedUpdate = WrappedUpdater(db)

  const tokenLength = 32

  const token_ = { tokenLength }

  token_.sendValidationEmail = function(user){
    if (user.validEmail) {
      const log = _.pick(user, [ '_id', 'creationStrategy' ])
      _.warn(log, 'email was already validated')
      return user
    }

    return getTokenData(tokenLength)
    .then((tokenData) => {
      const [ token, tokenHash ] = Array.from(tokenData)
      radio.emit('validation:email', user, token)
      wrappedUpdate(user._id, 'emailValidation', tokenHash)
      return user
    })
  }

  token_.confirmEmailValidity = (email, token) => user_.findOneByEmail(email)
  .then(updateIfValidToken.bind(null, token))
  .catch((err) => {
    if (err.notFound) { throw noEmailValidationFound(token, email)
    } else { throw err }
  })

  var updateIfValidToken = function(token, user){
    const { emailValidation, _id } = user
    if (emailValidation == null) {
      throw noEmailValidationFound(token, _id)
    }

    return testToken(emailValidation, token, tokenDaysToLive)
    .then(updateValidEmail.bind(null, db, _id))
  }

  var noEmailValidationFound = (...context) => error_.new('no email validation token found', 401, context)

  token_.sendResetPasswordEmail = user => getTokenData(tokenLength)
  .then((tokenData) => {
    const [ token, tokenHash ] = Array.from(tokenData)
    radio.emit('reset:password:email', user, token)
    wrappedUpdate(user._id, 'token', tokenHash)
    return user
  })

  token_.openPasswordUpdateWindow = user => db.update(user._id, (doc) => {
    doc.token = null
    doc.resetPassword = Date.now()
    return doc
  })

  return token_
}

var updateValidEmail = function(db, _id, valid){
  if (valid) { return db.update(_id, emailIsValid)
  } else { throw error_.new('token is invalid or expired', 401, _id) }
}

var emailIsValid = function(user){
  user.validEmail = true
  return _.omit(user, 'emailValidation')
}

var getTokenData = function(tokenLength){
  const token = randomString(tokenLength)
  return pw_.hash(token)
  .then(tokenHash => [ token, tokenHash ])
}
