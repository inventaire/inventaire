import { methodAndActionsControllersFactory } from '#lib/actions_controllers'
import type { EndpointSpecs } from '#types/api/specifications'
import addElements from './add_elements.js'
import byCreators from './by_creators.js'
import byElementId from './by_element_id.js'
import byEntities from './by_entities.js'
import byId from './by_id.js'
import byIds from './by_ids.js'
import create from './create.js'
import deleteByIds from './delete_by_ids.js'
import removeElements from './remove_elements.js'
import update from './update.js'
import updateElement from './update_element.js'

const methodsAndActionsControllers = {
  get: {
    public: {
      'by-id': byId,
      'by-element-id': byElementId,
      'by-ids': byIds,
      'by-entities': byEntities,
      'by-creators': byCreators,
    },
  },
  post: {
    authentified: {
      create,
      'add-elements': addElements,
      delete: deleteByIds,
      'remove-elements': removeElements,
      'update-element': updateElement,
    },
  },
  put: {
    authentified: {
      default: update,
    },
  },
}

export default methodAndActionsControllersFactory(methodsAndActionsControllers)

export const specs: EndpointSpecs = {
  name: 'lists',
  controllers: methodsAndActionsControllers,
}
