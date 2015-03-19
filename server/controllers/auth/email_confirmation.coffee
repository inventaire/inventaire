CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
User = __.require 'models', 'user'
user_ = __.require 'lib', 'user/user'
promises_ = __.require 'lib', 'promises'


module.exports = (req, res, next)->
  {user} = req
  unless user?
    return _.errorHandler(res, 'user not found', 500)

  promises_.start()
  .then sendEmailValidation.bind(null, user)
  .then -> res.send('ok')
  .catch (err)->
    _.log err.type, err.message
    unless err.type?
      return _.errorHandler(res, err, 500)

    _.errorHandler(res, err.message, 403)


sendEmailValidation = (user)->
  { _id, creationStrategy, validatedEmail} = user
  unless creationStrategy is 'local'
    err = new Error "wrong authentification creationStrategy: #{creationStrategy}"
    err.type = 'wrong_strategy'
    throw err

  if validatedEmail
    err = new Error "email was already validated"
    err.type = 'already_validated'
    throw err

  resetEmailValidation(_id)
  .then -> user_.byId(_id)
  # need the updated user object
  .then user_.sendValidationEmail.bind(null)

resetEmailValidation = (userId)->
  user_.db.update userId, (doc)->
    doc.emailValidation = User.getEmailValidationData()
    return doc