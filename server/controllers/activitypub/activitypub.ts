import { initRadioHooks } from '#controllers/activitypub/lib/radio_hooks'
import { actionsControllersFactory } from '#lib/actions_controllers'
import activity from './activity.js'
import actor from './actor.js'
import followers from './followers.js'
import inbox from './inbox.js'
import outbox from './outbox.js'

export default {
  get: actionsControllersFactory({
    public: {
      activity,
      actor,
      outbox,
      followers,
    },
  }),
  post: actionsControllersFactory({
    public: {
      inbox,
      'shared-inbox': inbox,
    },
  }),
}

initRadioHooks()
