import ActionsControllers from 'lib/actions_controllers'

export default {
  get: ActionsControllers({
    public: {
      activity: require('./activity'),
      actor: require('./actor'),
      outbox: require('./outbox')
    }
  }),
  post: ActionsControllers({
    public: {
      inbox: require('./inbox')
    }
  })
}

require('./lib/radio_hooks')()
