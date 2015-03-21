CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
Radio = __.require 'lib', 'radio'
User = __.require 'models', 'user'
error_ = __.require 'lib', 'error/error'

module.exports = (db)->

  token_ = {}

  token_.sendValidationEmail = (user)->
    unless user.validEmail
      Radio.emit 'validation:email', user
    else _.warn user, 'email was already validated'
    return user

  token_.byEmailValidationToken = (token)->
    db.viewFindOneByKey 'byEmailValidationToken', token

  token_.confirmEmailValidity = (token)->
    token_.byEmailValidationToken(token)
    .then updateIfValidToken.bind(null, token)

  updateIfValidToken = (token, user)->
    if user? and User.tests.token(token, user.emailValidation)
      db.update user._id, emailIsValid
    else
      throw error_.new 'token is invalid or expired', 401, token, user._id

  return token_


emailIsValid = (user)->
  user.validEmail = true
  return _.omit user, 'emailValidation'
