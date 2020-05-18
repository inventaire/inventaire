const __ = require('config').universalPath
const ActionsControllers = __.require('lib', 'actions_controllers')

module.exports = {
  get: ActionsControllers({
    public: {
      'by-ids': require('./by_ids'),
      'by-users': require('./by_users'),
      'by-entities': require('./by_entities'),
      'by-user-and-entities': require('./by_user_and_entities'),
      'inventory-view': require('./inventory_view'),
      'recent-public': require('./recent_public'),
      'last-public': require('./last_public'),
      search: require('./search')
    },
    authentified: {
      nearby: require('./nearby'),
      export: require('./export')
    }
  }),

  post: ActionsControllers({
    authentified: {
      default: require('./create'),
      'delete-by-ids': require('./delete_by_ids')
    },
    admin: {
      'refresh-snapshot': require('./refresh_snapshot')
    }
  }),

  put: ActionsControllers({
    authentified: {
      default: require('./update'),
      'bulk-update': require('./bulk_update')
    }
  })
}

require('./lib/snapshot/update_snapshot_on_entity_change')()
