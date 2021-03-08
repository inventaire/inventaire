const __ = require('config').universalPath
const ActionsControllers = require('lib/actions_controllers')
const { signup, login, logout } = require('./connection')
const { usernameAvailability, emailAvailability } = require('./availability')

module.exports = {
  get: ActionsControllers({
    public: {
      'username-availability': usernameAvailability,
      'email-availability': emailAvailability
    },
    authentified: {
      'wikidata-oauth': require('./wikidata_oauth')
    }
  }),

  post: ActionsControllers({
    public: {
      signup,
      login,
      logout,
      'reset-password': require('./reset_password')
    },
    authentified: {
      'email-confirmation': require('./email_confirmation'),
      'update-password': require('./update_password')
    }
  })
}
