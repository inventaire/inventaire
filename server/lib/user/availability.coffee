CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
User = __.require 'models', 'user'
isReservedWord = require './is_reserved_word'

module.exports = (user_)->
  username: (username)->
    unless User.validUsername(username)
      _.warn username, 'invalid username'
      return promises_.reject "invalid username: #{username}"

    if isReservedWord(username)
      _.warn username, 'reserved word'
      return promises_.reject "reserved words cant be usernames: #{username}"

    user_.byUsername(username)
    .then checkAvailability.bind(null, username, 'username')

  email: (email)->
    unless User.validEmail(email)
      _.warn email, 'invalid email'
      return promises_.reject "invalid email: #{email}"

    user_.byEmail(email)
    .then checkAvailability.bind(null, email, 'email')


checkAvailability = (value, label, docs)->
  if docs.length is 0
    _.success value, 'available'
    return value
  else
    err = new Error("This #{label} is already used")
    _.warn value, err.type = 'not_available'
    throw err
