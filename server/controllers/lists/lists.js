const ActionsControllers = require('lib/actions_controllers')

module.exports = {
  get: ActionsControllers({
    public: {
      'by-ids': require('./by_ids'),
      'by-creators': require('./by_creators')
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
