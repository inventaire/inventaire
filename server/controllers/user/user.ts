// The 'user' endpoint is dedicated to opeartions on the user
// by the user herself once authentified.

// Other controllers involving operations on users:
// - auth: authentification operations (signup, login, etc)
// - relations: handling friends relations
// - invitatitons: inviting people out of Inventaire
// - users: finding users by their usernames, positions, etc

import { keepSnapshotItemsCountsUpdated } from '#controllers/user/lib/keep_snapshot_items_counts_updated'
import { methodAndActionsControllersFactory } from '#lib/actions_controllers'
import type { EndpointSpecs } from '#types/api/specifications'
import delet from './delete.js'
import get from './get.js'
import update from './update.js'

const methodsAndActionsControllers = {
  get: {
    authentified: {
      default: get,
    },
  },
  put: {
    authentified: {
      default: update,
    },
  },
  delete: {
    authentified: {
      default: delet,
    },
  },
}

keepSnapshotItemsCountsUpdated()

export default methodAndActionsControllersFactory(methodsAndActionsControllers)

export const specs: EndpointSpecs = {
  name: 'user',
  description: 'Read and edit authentified user data',
  controllers: methodsAndActionsControllers,
}
