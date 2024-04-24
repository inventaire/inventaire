import ActionsControllers from '#lib/actions_controllers'
import addElements from './add_elements.js'
import byCreators from './by_creators.js'
import byEntities from './by_entities.js'
import byId from './by_id.js'
import byIds from './by_ids.js'
import create from './create.js'
import deleteByIds from './delete_by_ids.js'
import removeElements from './remove_elements.js'
import reorder from './reorder.js'
import update from './update.js'
import updateElement from './update_element.js'

export default {
  get: ActionsControllers({
    public: {
      'by-id': byId,
      'by-ids': byIds,
      'by-entities': byEntities,
      'by-creators': byCreators,
    },
  }),
  post: ActionsControllers({
    authentified: {
      create,
      'add-elements': addElements,
      delete: deleteByIds,
      'remove-elements': removeElements,
      reorder,
      'update-element': updateElement,
    },
  }),
  put: ActionsControllers({
    authentified: {
      default: update,
    },
  }),
}
