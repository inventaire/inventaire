import { updateSnapshotOnEntityChange } from '#controllers/items/lib/snapshot/update_snapshot_on_entity_change'
import { actionsControllersFactory } from '#lib/actions_controllers'
import bulkUpdate from './bulk_update.js'
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
import refreshSnapshot from './refresh_snapshot.js'
import search from './search.js'
import update from './update.js'

export default {
  get: actionsControllersFactory({
    public: {
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
  }),

  post: actionsControllersFactory({
    authentified: {
      default: create,
      'delete-by-ids': deleteByIds,
    },
    admin: {
      'refresh-snapshot': refreshSnapshot,
    },
  }),

  put: actionsControllersFactory({
    authentified: {
      default: update,
      'bulk-update': bulkUpdate,
    },
  }),
}

updateSnapshotOnEntityChange()
