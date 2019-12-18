// The 'user' endpoint is dedicated to opeartions on the user
// by the user herself once authentified.

// Other controllers involving operations on users:
// - auth: authentification operations (signup, login, etc)
// - relations: handling friends relations
// - invitatitons: inviting people out of Inventaire
// - users: finding users by their usernames, positions, etc

const __ = require('config').universalPath
const ActionsControllers = __.require('lib', 'actions_controllers')

module.exports = {
  get: ActionsControllers({
    authentified: {
      default: require('./get')
    }
  }),
  put: ActionsControllers({
    authentified: {
      default: require('./update')
    }
  }),
  delete: ActionsControllers({
    authentified: {
      default: require('./delete')
    }
  })
}

require('./lib/keep_snapshot_items_counts_updated')()
