import CONFIG from 'config'
import _ from '#builders/utils'
import radio from '#lib/radio'
import error_ from '#lib/error/error'
import { passwords as pw_ } from '#lib/crypto'
import { WrappedUpdater } from '#lib/doc_updates'
import randomString from '#lib/utils/random_string'
import dbFactory from '#db/couchdb/base'
import user_ from './user.js'

const { tokenDaysToLive } = CONFIG

const testToken = pw_.verify
const db = dbFactory('users')
const wrappedUpdate = WrappedUpdater(db)
const tokenLength = 32

export default {
  tokenLength,

  sendValidationEmail: async user => {
    if (user.validEmail) {
      const log = _.pick(user, [ '_id', 'creationStrategy' ])
      _.warn(log, 'email was already validated')
      return user
    }

    const [ token, tokenHash ] = await getTokenData()
    await radio.emit('validation:email', user, token)
    await wrappedUpdate(user._id, 'emailValidation', tokenHash)
    return user
  },

  confirmEmailValidity: (email, token) => {
    return user_.findOneByEmail(email)
    .then(updateIfValidToken.bind(null, token))
    .catch(err => {
      if (err.notFound) throw noEmailValidationFound(token, email)
      else throw err
    })
  },

  sendResetPasswordEmail: async user => {
    const [ token, tokenHash ] = await getTokenData()
    await radio.emit('reset:password:email', user, token)
    await wrappedUpdate(user._id, 'token', tokenHash)
    return user
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
