const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const radio = __.require('lib', 'radio')
const error_ = __.require('lib', 'error/error')
const pw_ = __.require('lib', 'crypto').passwords
const { tokenDaysToLive } = CONFIG
const { WrappedUpdater } = __.require('lib', 'doc_updates')
const randomString = __.require('lib', 'utils/random_string')
const testToken = pw_.verify

module.exports = (db, user_) => {
  const wrappedUpdate = WrappedUpdater(db)

  const tokenLength = 32

  const token_ = { tokenLength }

  token_.sendValidationEmail = user => {
    if (user.validEmail) {
      const log = _.pick(user, [ '_id', 'creationStrategy' ])
      _.warn(log, 'email was already validated')
      return user
    }

    return getTokenData(tokenLength)
    .then(tokenData => {
      const [ token, tokenHash ] = Array.from(tokenData)
      radio.emit('validation:email', user, token)
      wrappedUpdate(user._id, 'emailValidation', tokenHash)
      return user
    })
  }

  token_.confirmEmailValidity = (email, token) => user_.findOneByEmail(email)
  .then(updateIfValidToken.bind(null, token))
  .catch(err => {
    if (err.notFound) throw noEmailValidationFound(token, email)
    else throw err
  })

  const updateIfValidToken = (token, user) => {
    const { emailValidation, _id } = user
    if (emailValidation == null) {
      throw noEmailValidationFound(token, _id)
    }

    return testToken(emailValidation, token, tokenDaysToLive)
    .then(updateValidEmail.bind(null, db, _id))
  }

  const noEmailValidationFound = (...context) => error_.new('no email validation token found', 401, context)

  token_.sendResetPasswordEmail = user => {
    return getTokenData(tokenLength)
    .then(tokenData => {
      const [ token, tokenHash ] = Array.from(tokenData)
      radio.emit('reset:password:email', user, token)
      wrappedUpdate(user._id, 'token', tokenHash)
      return user
    })
  }

  token_.openPasswordUpdateWindow = user => {
    return db.update(user._id, doc => {
      doc.token = null
      doc.resetPassword = Date.now()
      return doc
    })
  }

  return token_
}

const updateValidEmail = (db, _id, valid) => {
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

const getTokenData = tokenLength => {
  const token = randomString(tokenLength)
  return pw_.hash(token)
  .then(tokenHash => [ token, tokenHash ])
}
