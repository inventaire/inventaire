import { methodAndActionsControllersFactory } from '#lib/actions_controllers'
import type { EndpointSpecs } from '#types/api/specifications'
import relationsActions from './actions.js'
import get from './get.js'

const methodsAndActionsControllers = {
  get: {
    authentified: {
      default: get,
    },
  },

  post: {
    authentified: {
      request: relationsActions('request'),
      cancel: relationsActions('cancel'),
      accept: relationsActions('accept'),
      discard: relationsActions('discard'),
      unfriend: relationsActions('unfriend'),
    },
  },
}

export default methodAndActionsControllersFactory(methodsAndActionsControllers)

export const specs: EndpointSpecs = {
  name: 'relations',
  controllers: methodsAndActionsControllers,
}
