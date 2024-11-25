// The 'user' endpoint is dedicated to opeartions on the user
// by the user herself once authentified.

// Other controllers involving operations on users:
// - auth: authentification operations (signup, login, etc)
// - relations: handling friends relations
// - invitatitons: inviting people out of Inventaire
// - users: finding users by their usernames, positions, etc

import { keepSnapshotItemsCountsUpdated } from '#controllers/user/lib/keep_snapshot_items_counts_updated'
import { actionsControllersFactory } from '#lib/actions_controllers'
import delet from './delete.js'
import get from './get.js'
import update from './update.js'

export default {
  get: actionsControllersFactory({
    authentified: {
      default: get,
    },
  }),
  put: actionsControllersFactory({
    authentified: {
      default: update,
    },
  }),
  delete: actionsControllersFactory({
    authentified: {
      default: delet,
    },
  }),
}

keepSnapshotItemsCountsUpdated()
