import ActionsControllers from '#lib/actions_controllers'
import { signup, login, logout } from './connection.js'
import { usernameAvailability, emailAvailability } from './availability.js'

export default {
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
