import { initRadioHooks } from '#controllers/activitypub/lib/radio_hooks'
import ActionsControllers from '#lib/actions_controllers'
import activity from './activity.js'
import actor from './actor.js'
import inbox from './inbox.js'
import outbox from './outbox.js'

export default {
  get: ActionsControllers({
    public: {
      activity,
      actor,
      outbox,
    },
  }),
  post: ActionsControllers({
    public: {
      inbox,
    },
  }),
}

initRadioHooks()
