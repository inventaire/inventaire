import events from '#controllers/instances/events'
import subscribe from '#controllers/instances/subscribe'
import { methodAndActionsControllersFactory } from '#lib/actions_controllers'
import type { EndpointSpecs } from '#types/api/specifications'

const methodsAndActionsControllers = {
  post: {
    authentified: {
      subscribe,
      events,
    },
  },
}

export default methodAndActionsControllersFactory(methodsAndActionsControllers)

export const specs: EndpointSpecs = {
  name: 'instances',
  controllers: methodsAndActionsControllers,
}
