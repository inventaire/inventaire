import { methodAndActionsControllersFactory } from '#lib/actions_controllers'
import type { EndpointSpecs } from '#types/api/specifications'
import bulkUpdate from './bulk_update.js'
import byBbox from './by_bbox.js'
import byEntities from './by_entities.js'
import byIds from './by_ids.js'
import byUserAndEntities from './by_user_and_entities.js'
import byUsers from './by_users.js'
import create from './create.js'
import deleteByIds from './delete_by_ids.js'
import exportt from './export.js'
import inventoryView from './inventory_view.js'
import lastPublic from './last_public.js'
import nearby from './nearby.js'
import recentPublic from './recent_public.js'
import search from './search.js'
import update from './update.js'

const methodsAndActionsControllers = {
  get: {
    public: {
      'by-bbox': byBbox,
      'by-ids': byIds,
      'by-users': byUsers,
      'by-entities': byEntities,
      'by-user-and-entities': byUserAndEntities,
      'inventory-view': inventoryView,
      'recent-public': recentPublic,
      'last-public': lastPublic,
      search,
    },
    authentified: {
      nearby,
      export: exportt,
    },
  },

  post: {
    authentified: {
      default: create,
      'delete-by-ids': deleteByIds,
    },
  },

  put: {
    authentified: {
      default: update,
      'bulk-update': bulkUpdate,
    },
  },
}

export default methodAndActionsControllersFactory(methodsAndActionsControllers)

export const specs: EndpointSpecs = {
  name: 'items',
  description: "Items are what users' inventories are made of",
  externalDocs: {
    url: 'https://wiki.inventaire.io/wiki/Glossary#Item',
    description: 'Glossary',
  },
  controllers: methodsAndActionsControllers,
}
