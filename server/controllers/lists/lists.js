const ActionsControllers = require('lib/actions_controllers')

module.exports = {
  get: ActionsControllers({
    public: {
      'by-id': require('./by_id'),
      'by-ids': require('./by_ids'),
      'by-entities': require('./by_entities'),
      'by-creators': require('./by_creators')
    }
  }),
  post: ActionsControllers({
    authentified: {
      create: require('./create'),
      'add-selections': require('./add_selections'),
      'remove-selections': require('./remove_selections'),
      delete: require('./delete_by_ids')
    }
  }),
  put: ActionsControllers({
    authentified: {
      default: require('./update'),
    }
  })
}
