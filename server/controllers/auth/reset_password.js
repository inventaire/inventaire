// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const sanitize = __.require('lib', 'sanitize/sanitize')
const responses_ = __.require('lib', 'responses')
const user_ = __.require('controllers', 'user/lib/user')
const isValidEmail = __.require('models', 'validations/user').email

const sanitization =
  { email: {} }

module.exports = (req, res, next) => sanitize(req, res, sanitization)
.then(params => user_.findOneByEmail(params.email))
.catch((err) => {
  if (err.statusCode === 404) {
    throw error_.new('email not found', 400, email)
  } else {
    throw err
  }}).then(user_.sendResetPasswordEmail)
.then(responses_.Ok(res))
.catch(error_.Handler(req, res))
