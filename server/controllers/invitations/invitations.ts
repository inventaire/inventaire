import { methodAndActionsControllersFactory } from '#lib/actions_controllers'
import type { EndpointSpecs } from '#types/api/specifications'
import byEmails from './by_emails.js'

const methodsAndActionsControllers = {
  post: {
    authentified: {
      'by-emails': byEmails,
    },
  },
}

export default methodAndActionsControllersFactory(methodsAndActionsControllers)

export const specs: EndpointSpecs = {
  name: 'invitations',
  controllers: methodsAndActionsControllers,
}
