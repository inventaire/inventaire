import { initSideEffects } from '#controllers/transactions/lib/side_effects'
import { methodAndActionsControllersFactory } from '#lib/actions_controllers'
import type { EndpointSpecs } from '#types/api/specifications'
import get from './get.js'
import getByItem from './get_by_item.js'
import getMessages from './get_messages.js'
import markAsRead from './mark_as_read.js'
import postMessage from './post_message.js'
import request from './request.js'
import updateState from './update_state.js'

const methodsAndActionsControllers = {
  get: {
    authentified: {
      default: get,
      'get-messages': getMessages,
      'by-item': getByItem,
    },
  },

  post: {
    authentified: {
      request,
      message: postMessage,
    },
  },

  put: {
    authentified: {
      'update-state': updateState,
      'mark-as-read': markAsRead,
    },
  },
}

initSideEffects()

export default methodAndActionsControllersFactory(methodsAndActionsControllers)

export const specs: EndpointSpecs = {
  name: 'transactions',
  description: 'When users request each others items',
  externalDocs: {
    url: 'https://wiki.inventaire.io/wiki/Glossary#Transaction',
    description: 'Glossary',
  },
  controllers: methodsAndActionsControllers,
}
