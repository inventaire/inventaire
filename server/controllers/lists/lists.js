const ActionsControllers = require('lib/actions_controllers')

module.exports = {
  get: ActionsControllers({
    public: {
      'by-ids': require('./by_ids'),
      'by-users': require('./by_users')
    }
  }),
  post: ActionsControllers({
    authentified: {
      create: require('./create'),
    }
  }),
  put: ActionsControllers({
    authentified: {
      default: require('./update'),
    }
  })
}
