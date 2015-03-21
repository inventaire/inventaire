CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
User = __.require 'models', 'user'
user_ = __.require 'lib', 'user/user'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'

module.exports = (req, res, next)->
  {user} = req
  unless user?
    return error_.bundle res, 'user not found', 500

  promises_.start()
  .then sendEmailValidation.bind(null, user)
  .then -> res.send('ok')
  .catch error_.Handler(res)


sendEmailValidation = (user)->
  { _id, creationStrategy, validEmail} = user
  unless creationStrategy is 'local'
    throw error_.new "wrong authentification creationStrategy", 400

  if validEmail
    throw error_.new "email was already validated", 400

  resetEmailValidation(_id)
  .then -> user_.byId(_id)
  # need the updated user object
  .then user_.sendValidationEmail.bind(null)

resetEmailValidation = (userId)->
  user_.db.update userId, (doc)->
    doc.emailValidation = User.getEmailValidationData()
    return doc