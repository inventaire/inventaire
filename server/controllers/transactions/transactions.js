import ActionsControllers from '#lib/actions_controllers'

export default {
  get: ActionsControllers({
    authentified: {
      default: require('./get'),
      'get-messages': require('./get_messages'),
      'by-item': require('./get_by_item'),
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
