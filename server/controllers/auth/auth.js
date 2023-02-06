import emailConfirmation from '#controllers/auth/email_confirmation'
import resetPassword from '#controllers/auth/reset_password'
import updatePassword from '#controllers/auth/update_password'
import wikidataOauth from '#controllers/auth/wikidata_oauth'
import ActionsControllers from '#lib/actions_controllers'
import { usernameAvailability, emailAvailability } from './availability.js'
import { signup, login, logout } from './connection.js'

export default {
  get: ActionsControllers({
    public: {
      'username-availability': usernameAvailability,
      'email-availability': emailAvailability,
    },
    authentified: {
      'wikidata-oauth': wikidataOauth,
    },
  }),

  post: ActionsControllers({
    public: {
      signup,
      login,
      logout,
      'reset-password': resetPassword,
    },
    authentified: {
      'email-confirmation': emailConfirmation,
      'update-password': updatePassword,
    },
  }),
}
