import ActionsControllers from 'lib/actions_controllers'

export default {
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
      'add-elements': require('./add_elements'),
      'remove-elements': require('./remove_elements'),
      delete: require('./delete_by_ids')
    }
  }),
  put: ActionsControllers({
    authentified: {
      default: require('./update'),
    }
  })
}
