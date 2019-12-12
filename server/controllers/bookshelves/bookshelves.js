const __ = require('config').universalPath
const ActionsControllers = __.require('lib', 'actions_controllers')

module.exports = {
  get: ActionsControllers({
    authentified: {
      'by-ids': require('./by_ids'),
      'by-owners': require('./by_owners')
    }
  }),
  post: ActionsControllers({
    authentified: {
      create: require('./create'),
      'add-items': require('./add_items'),
      'remove-items': require('./remove_items')
    }
  })
}
