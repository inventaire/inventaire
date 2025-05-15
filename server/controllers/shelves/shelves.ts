import { methodAndActionsControllersFactory } from '#lib/actions_controllers'
import type { EndpointSpecs } from '#types/api/specifications'
import byIds from './by_ids.js'
import byOwners from './by_owners.js'
import create from './create.js'
import deleteByIds from './delete_by_ids.js'
import { addItems, removeItems } from './items_actions.js'
import update from './update.js'

const methodsAndActionsControllers = {
  get: {
    public: {
      'by-ids': byIds,
      'by-owners': byOwners,
    },
  },
  post: {
    authentified: {
      create,
      // TODO: harmonize with other endpoints to have 'update'
      // and assimilated actions use the PUT method
      update,
      'add-items': addItems,
      'remove-items': removeItems,
      delete: deleteByIds,
    },
  },
}

export default methodAndActionsControllersFactory(methodsAndActionsControllers)

export const specs: EndpointSpecs = {
  name: 'shelves',
  description: "Shelves are subsections of a user inventory. Items added to a shelf must belong to the shelf' owner.",
  externalDocs: {
    url: 'https://wiki.inventaire.io/wiki/Glossary#Shelf',
    description: 'Glossary',
  },
  controllers: methodsAndActionsControllers,
}
