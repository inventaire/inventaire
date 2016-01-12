CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
User = __.require 'models', 'user'
isReservedWord = require './is_reserved_word'
error_ = __.require 'lib', 'error/error'

module.exports = (user_)->
  username: (username)->
    unless User.tests.username username
      return error_.reject "invalid username", 400, username

    if isReservedWord username
      return error_.reject "reserved words cant be usernames", 400, username

    user_.byUsername username
    .then checkAvailability.bind(null, username, 'username')

  email: (email)->
    unless User.tests.email email
      return error_.reject "invalid email", 400, email

    user_.byEmail email
    .then checkAvailability.bind(null, email, 'email')


checkAvailability = (value, label, docs)->
  unless docs.length is 0
    throw error_.new "this #{label} is already used", 400, value

  _.success value, 'available'
  return value
