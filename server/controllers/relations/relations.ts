import { actionsControllersFactory } from '#lib/actions_controllers'
import relationsActions from './actions.js'
import get from './get.js'

export default {
  get: actionsControllersFactory({
    authentified: {
      default: get,
    },
  }),

  post: actionsControllersFactory({
    authentified: {
      request: relationsActions('request'),
      cancel: relationsActions('cancel'),
      accept: relationsActions('accept'),
      discard: relationsActions('discard'),
      unfriend: relationsActions('unfriend'),
    },
  }),
}
