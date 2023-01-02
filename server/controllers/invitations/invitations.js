import ActionsControllers from '#lib/actions_controllers'
import byEmails from './by_emails.js'

export default {
  post: ActionsControllers({
    authentified: {
      'by-emails': byEmails,
    },
  }),
}
