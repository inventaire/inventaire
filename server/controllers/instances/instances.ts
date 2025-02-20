import events from '#controllers/instances/events'
import subscribe from '#controllers/instances/subscribe'
import { actionsControllersFactory } from '#lib/actions_controllers'

export default {
  post: actionsControllersFactory({
    authentified: {
      subscribe,
      events,
    },
  }),
}
