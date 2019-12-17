const __ = require('config').universalPath
const ActionsControllers = __.require('lib', 'actions_controllers')
const itemsActions = require('./items_actions')
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
      'add-items': itemsActions('add_items'),
      'delete-items': itemsActions('delete_items'),
      delete: require('./delete_by_ids')
    }
  })
}
