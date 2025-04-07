import emailConfirmation from '#controllers/auth/email_confirmation'
import resetPassword from '#controllers/auth/reset_password'
import { signedUrlGetter, signedUrlAction } from '#controllers/auth/signed_url'
import updatePassword from '#controllers/auth/update_password'
import wikidataOauth from '#controllers/auth/wikidata_oauth'
import { actionsControllersFactory } from '#lib/actions_controllers'
import { usernameAvailability, emailAvailability } from './availability.js'
import { signup, login, logout } from './connection.js'

export default {
  get: actionsControllersFactory({
    public: {
      'username-availability': usernameAvailability,
      'email-availability': emailAvailability,
      'signed-url': signedUrlGetter,
    },
    authentified: {
      'wikidata-oauth': wikidataOauth,
    },
  }),

  post: actionsControllersFactory({
    public: {
      signup,
      login,
      logout,
      'reset-password': resetPassword,
      'signed-url': signedUrlAction,
    },
    authentified: {
      'email-confirmation': emailConfirmation,
      'update-password': updatePassword,
    },
  }),
}
