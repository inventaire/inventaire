const ActionsControllers = require('lib/actions_controllers')

module.exports = {
  get: ActionsControllers({
    public: {
      activity: require('./activity'),
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
require('./lib/create_activities_on_entities_updates')()
