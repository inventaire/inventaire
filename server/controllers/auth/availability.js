const availability_ = require('controllers/user/lib/availability')

module.exports = {
  usernameAvailability: {
    sanitization: { username: {} },
    controller: async ({ username }) => {
      // Checks for validity, availability, reserved words
      await availability_.username(username)
      return { username, status: 'available' }
    },
  },

  emailAvailability: {
    sanitization: { email: {} },
    controller: async ({ email }) => {
      // Checks for validity, availability
      await availability_.email(email)
      return { email, status: 'available' }
    },
  },
}
