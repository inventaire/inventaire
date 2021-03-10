const _ = require('builders/utils')
const User = require('models/user')
const isReservedWord = require('./is_reserved_word')
const error_ = require('lib/error/error')
const user_ = require('./user')

module.exports = {
  username: async (username, currentUsername) => {
    // If a currentUsername is provided
    // return true if the new username is the same but with a different case
    // (used for username update)
    if (currentUsername) {
      if (username.toLowerCase() === currentUsername.toLowerCase()) return
    }

    if (!User.validations.username(username)) {
      throw error_.newInvalid('username', username)
    }

    if (isReservedWord(username)) {
      throw error_.new("reserved words can't be usernames", 400, username)
    }

    return user_.byUsername(username)
    .then(checkAvailability.bind(null, username, 'username'))
  },

  email: async email => {
    if (!User.validations.email(email)) {
      throw error_.newInvalid('email', email)
    }

    return user_.byEmail(email)
    .then(checkAvailability.bind(null, email, 'email'))
  }
}

const checkAvailability = (value, label, docs) => {
  if (docs.length !== 0) {
    throw error_.new(`this ${label} is already used`, 400, value)
  }

  _.success(value, 'available')
  return value
}
