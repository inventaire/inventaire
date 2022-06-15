const ActionsControllers = require('lib/actions_controllers')

module.exports = {
  get: ActionsControllers({
    authentified: {
      default: require('./get'),
      'get-messages': require('./get_messages'),
    }
  }),

  post: ActionsControllers({
    authentified: {
      request: require('./request'),
      message: require('./post_message'),
    }
  }),

  put: ActionsControllers({
    authentified: {
      'update-state': require('./update_state'),
      'mark-as-read': require('./mark_as_read')
    }
  })
}

require('./lib/side_effects')()
