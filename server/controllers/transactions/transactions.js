const messages = require('./messages')
const ActionsControllers = require('lib/actions_controllers')

module.exports = {
  get: ActionsControllers({
    authentified: {
      default: require('./get'),
      'get-messages': messages.get
    }
  }),

  post: ActionsControllers({
    authentified: {
      request: require('./request'),
      message: messages.post
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
