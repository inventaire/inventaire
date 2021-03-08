const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = require('builders/utils')
const radio = require('lib/radio')
const error_ = require('lib/error/error')
const pw_ = require('lib/crypto').passwords
const { tokenDaysToLive } = CONFIG
const { WrappedUpdater } = require('lib/doc_updates')
const randomString = require('lib/utils/random_string')
const testToken = pw_.verify
const user_ = require('./user')
const db = require('db/couchdb/base')('users')
const wrappedUpdate = WrappedUpdater(db)
const tokenLength = 32

module.exports = {
  tokenLength,

  sendValidationEmail: user => {
    if (user.validEmail) {
      const log = _.pick(user, [ '_id', 'creationStrategy' ])
      _.warn(log, 'email was already validated')
      return user
    }

    return getTokenData()
    .then(([ token, tokenHash ]) => {
      radio.emit('validation:email', user, token)
      wrappedUpdate(user._id, 'emailValidation', tokenHash)
      return user
    })
  },

  confirmEmailValidity: (email, token) => {
    return user_.findOneByEmail(email)
    .then(updateIfValidToken.bind(null, token))
    .catch(err => {
      if (err.notFound) throw noEmailValidationFound(token, email)
      else throw err
    })
  },

  sendResetPasswordEmail: user => {
    return getTokenData()
    .then(([ token, tokenHash ]) => {
      radio.emit('reset:password:email', user, token)
      wrappedUpdate(user._id, 'token', tokenHash)
      return user
    })
  },

  openPasswordUpdateWindow: user => {
    return db.update(user._id, doc => {
      doc.token = null
      doc.resetPassword = Date.now()
      return doc
    })
  }
}

const updateIfValidToken = (token, user) => {
  const { emailValidation, _id } = user
  if (emailValidation == null) {
    throw noEmailValidationFound(token, _id)
  }

  return testToken(emailValidation, token, tokenDaysToLive)
  .then(updateValidEmail.bind(null, _id))
}

const noEmailValidationFound = (token, key) => {
  return error_.new('no email validation token found', 401, { token, key })
}

const updateValidEmail = (_id, valid) => {
  if (valid) {
    return db.update(_id, emailIsValid)
  } else {
    throw error_.new('token is invalid or expired', 401, _id)
  }
}

const emailIsValid = user => {
  user.validEmail = true
  return _.omit(user, 'emailValidation')
}

const getTokenData = () => {
  const token = randomString(tokenLength)
  return pw_.hash(token)
  .then(tokenHash => [ token, tokenHash ])
}
