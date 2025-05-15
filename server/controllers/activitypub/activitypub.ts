import { initRadioHooks } from '#controllers/activitypub/lib/radio_hooks'
import { methodAndActionsControllersFactory } from '#lib/actions_controllers'
import type { EndpointSpecs } from '#types/api/specifications'
import activity from './activity.js'
import actor from './actor.js'
import followers from './followers.js'
import inbox from './inbox.js'
import outbox from './outbox.js'

const methodsAndActionsControllers = {
  get: {
    public: {
      activity,
      actor,
      outbox,
      followers,
    },
  },
  post: {
    public: {
      inbox,
      'shared-inbox': inbox,
    },
  },
}

export default methodAndActionsControllersFactory(methodsAndActionsControllers)

initRadioHooks()

export const specs: EndpointSpecs = {
  name: 'activitypub',
  controllers: methodsAndActionsControllers,
}
