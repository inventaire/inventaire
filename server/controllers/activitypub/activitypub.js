const ActionsControllers = require('lib/actions_controllers')

module.exports = {
  get: ActionsControllers({
    public: {
      actor: require('./actor'),
      outbox: require('./outbox')
    }
  }),
  post: ActionsControllers({
    signed: {
      inbox: require('./inbox')
    }
  })
}

require('./lib/create_activities_on_items_updates')()
