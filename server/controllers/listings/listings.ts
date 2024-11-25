import { actionsControllersFactory } from '#lib/actions_controllers'
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

export default {
  get: actionsControllersFactory({
    public: {
      'by-id': byId,
      'by-element-id': byElementId,
      'by-ids': byIds,
      'by-entities': byEntities,
      'by-creators': byCreators,
    },
  }),
  post: actionsControllersFactory({
    authentified: {
      create,
      'add-elements': addElements,
      delete: deleteByIds,
      'remove-elements': removeElements,
      'update-element': updateElement,
    },
  }),
  put: actionsControllersFactory({
    authentified: {
      default: update,
    },
  }),
}
