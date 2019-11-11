// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const User = __.require('models', 'user')
const user_ = __.require('controllers', 'user/lib/user')
const promises_ = __.require('lib', 'promises')
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')

module.exports = function(req, res, next){
  const { user } = req
  if (user == null) {
    return error_.bundle(req, res, 'user not found', 500)
  }

  return promises_.try(sendEmailValidation.bind(null, user))
  .then(responses_.Ok(res))
  .catch(error_.Handler(req, res))
}

var sendEmailValidation = function(user){
  const { _id, creationStrategy, validEmail } = user
  if (creationStrategy !== 'local') {
    throw error_.new('wrong authentification creationStrategy', 400)
  }

  if (validEmail) {
    throw error_.new('email was already validated', 400)
  }

  return user_.sendValidationEmail(user)
}
