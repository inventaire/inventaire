const ActionsControllers = require('lib/actions_controllers')

module.exports = {
  get: ActionsControllers({
    public: {
      actor: require('./actor')
    }
  }),
  post: ActionsControllers({
    public: {
      inbox: require('./inbox')
    }
  })
}
