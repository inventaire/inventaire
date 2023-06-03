import CONFIG from 'config'
import _ from '#builders/utils'
import { findUserByEmail } from '#controllers/user/lib/user'
import dbFactory from '#db/couchdb/base'
import { passwords as pw_ } from '#lib/crypto'
import { WrappedUpdater } from '#lib/doc_updates'
import { error_ } from '#lib/error/error'
import { emit } from '#lib/radio'
import { warn } from '#lib/utils/logs'
import { getRandomString } from '#lib/utils/random_string'

const { tokenDaysToLive } = CONFIG

const testToken = pw_.verify
const db = await dbFactory('users')
const wrappedUpdate = WrappedUpdater(db)
export const tokenLength = 32

export async function sendValidationEmail (user) {
  if (user.validEmail) {
    const log = _.pick(user, [ '_id', 'creationStrategy' ])
    warn(log, 'email was already validated')
    return user
  }

  const [ token, tokenHash ] = await getTokenData()
  await emit('validation:email', user, token)
  await wrappedUpdate(user._id, 'emailValidation', tokenHash)
  return user
}

export const confirmEmailTokenValidity = (email, token) => {
  return findUserByEmail(email)
  .then(updateIfValidToken.bind(null, token))
  .catch(err => {
    if (err.notFound) throw noEmailValidationFound(token, email)
    else throw err
  })
}

export async function sendResetPasswordEmail (user) {
  const [ token, tokenHash ] = await getTokenData()
  await emit('reset:password:email', user, token)
  await wrappedUpdate(user._id, 'token', tokenHash)
  return user
}

export const openPasswordUpdateWindow = user => {
  return db.update(user._id, doc => {
    doc.token = null
    doc.resetPassword = Date.now()
    return doc
  })
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
  const token = getRandomString(tokenLength)
  return pw_.hash(token)
  .then(tokenHash => [ token, tokenHash ])
}
