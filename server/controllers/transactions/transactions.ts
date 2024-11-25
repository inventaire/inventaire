import { initSideEffects } from '#controllers/transactions/lib/side_effects'
import { actionsControllersFactory } from '#lib/actions_controllers'
import get from './get.js'
import getByItem from './get_by_item.js'
import getMessages from './get_messages.js'
import markAsRead from './mark_as_read.js'
import postMessage from './post_message.js'
import request from './request.js'
import updateState from './update_state.js'

export default {
  get: actionsControllersFactory({
    authentified: {
      default: get,
      'get-messages': getMessages,
      'by-item': getByItem,
    },
  }),

  post: actionsControllersFactory({
    authentified: {
      request,
      message: postMessage,
    },
  }),

  put: actionsControllersFactory({
    authentified: {
      'update-state': updateState,
      'mark-as-read': markAsRead,
    },
  }),
}

initSideEffects()
