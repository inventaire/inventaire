const __ = require('config').universalPath
const ActionsControllers = __.require('lib', 'actions_controllers')
const { addItems, removeItems } = require('./items_actions')

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
      update: require('./update'),
      'add-items': addItems,
      'remove-items': removeItems,
      delete: require('./delete_by_ids')
    }
  })
}
