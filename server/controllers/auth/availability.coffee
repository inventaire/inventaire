CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
user_ = __.require 'lib', 'user/user'

exports.usernameAvailability = (req, res, next) ->
  {username} = req.body
  # checks for validity, availability, reserve words
  user_.availability.username username
  .then -> res.json {username: username, status: 'available'}
  .catch catchAvailabilityError.bind(null, res, username, 'username')


exports.emailAvailability = (req, res, next) ->
  {email} = req.body
  # checks for validity, availability
  user_.availability.email email
  .then -> res.json {email: email, status: 'available'}
  .catch catchAvailabilityError.bind(null, res, email, 'email')


catchAvailabilityError = (res, value, label, err)->
  {type} = err
  unless type is 'not_available'
    return _.errorHandler(res, "invalid #{label}", 400)

  obj =
    status: type
    status_verbose: "this #{label} is already used"

  obj[label] = value
  res.status(400).json obj
