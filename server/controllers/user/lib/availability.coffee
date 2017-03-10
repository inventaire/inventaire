CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
User = __.require 'models', 'user'
isReservedWord = require './is_reserved_word'
error_ = __.require 'lib', 'error/error'

module.exports = (user_)->
  username: (username, currentUsername)->
    # If a currentUsername is provided
    # return true if the new username is the same but with a different case
    # (used for username update)
    if currentUsername?
      if username.toLowerCase() is currentUsername.toLowerCase()
        return promises_.resolved

    unless User.tests.username username
      return error_.rejectInvalid 'username', username

    if isReservedWord username
      return error_.reject "reserved words can't be usernames", 400, username

    user_.byUsername username
    .then checkAvailability.bind(null, username, 'username')

  email: (email)->
    unless User.tests.email email
      return error_.rejectInvalid 'email', email

    user_.byEmail email
    .then checkAvailability.bind(null, email, 'email')

checkAvailability = (value, label, docs)->
  unless docs.length is 0
    throw error_.new "this #{label} is already used", 400, value

  _.success value, 'available'
  return value
