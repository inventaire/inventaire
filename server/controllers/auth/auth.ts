import emailConfirmation from '#controllers/auth/email_confirmation'
import resetPassword from '#controllers/auth/reset_password'
import updatePassword from '#controllers/auth/update_password'
import wikidataOauth from '#controllers/auth/wikidata_oauth'
import { methodAndActionsControllersFactory } from '#lib/actions_controllers'
import type { EndpointSpecs } from '#types/api/specifications'
import { usernameAvailability, emailAvailability } from './availability.js'
import { signup, login, logout } from './connection.js'

const methodsAndActionsControllers = {
  get: {
    public: {
      'username-availability': usernameAvailability,
      'email-availability': emailAvailability,
    },
    authentified: {
      'wikidata-oauth': wikidataOauth,
    },
  },

  post: {
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
  },
}

export default methodAndActionsControllersFactory(methodsAndActionsControllers)

export const specs: EndpointSpecs = {
  name: 'auth',
  description: 'Signup, login, etc',
  controllers: methodsAndActionsControllers,
}
