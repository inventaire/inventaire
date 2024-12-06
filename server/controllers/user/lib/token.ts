import { omit, pick } from 'lodash-es'
import { findUserByEmail } from '#controllers/user/lib/user'
import dbFactory from '#db/couchdb/base'
import { hashPassword, verifyPassword } from '#lib/crypto'
import { WrappedUpdater } from '#lib/doc_updates'
import { newError } from '#lib/error/error'
import { emit } from '#lib/radio'
import { warn } from '#lib/utils/logs'
import { getRandomString } from '#lib/utils/random_string'
import config from '#server/config'

const { tokenDaysToLive } = config

const testToken = verifyPassword
const db = await dbFactory('users')
const wrappedUpdate = WrappedUpdater(db)
export const tokenLength = 32

export async function sendValidationEmail (user) {
  if (user.validEmail) {
    const log = pick(user, [ '_id' ])
    warn(log, 'email was already validated')
    return user
  }

  const [ token, tokenHash ] = await getTokenData()
  await emit('validation:email', user, token)
  await wrappedUpdate(user._id, 'emailValidation', tokenHash)
  return user
}

export function confirmEmailTokenValidity (email, token) {
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

export function openPasswordUpdateWindow (user) {
  return db.update(user._id, doc => {
    doc.token = null
    doc.resetPassword = Date.now()
    return doc
  })
}

function updateIfValidToken (token, user) {
  const { emailValidation, _id } = user
  if (emailValidation == null) {
    throw noEmailValidationFound(token, _id)
  }

  return testToken(emailValidation, token, tokenDaysToLive)
  .then(updateValidEmail.bind(null, _id))
}

function noEmailValidationFound (token, key) {
  return newError('no email validation token found', 401, { token, key })
}

function updateValidEmail (_id, valid) {
  if (valid) {
    return db.update(_id, emailIsValid)
  } else {
    throw newError('token is invalid or expired', 401, _id)
  }
}

function emailIsValid (user) {
  user.validEmail = true
  return omit(user, 'emailValidation')
}

function getTokenData () {
  const token = getRandomString(tokenLength)
  return hashPassword(token)
  .then(tokenHash => [ token, tokenHash ])
}
