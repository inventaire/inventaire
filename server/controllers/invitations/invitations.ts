import { actionsControllersFactory } from '#lib/actions_controllers'
import byEmails from './by_emails.js'

export default {
  post: actionsControllersFactory({
    authentified: {
      'by-emails': byEmails,
    },
  }),
}
