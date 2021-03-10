const ActionsControllers = require('lib/actions_controllers')
const relationsActions = require('./actions')

module.exports = {
  get: ActionsControllers({
    authentified: {
      default: require('./get')
    }
  }),

  post: ActionsControllers({
    authentified: {
      request: relationsActions('request'),
      cancel: relationsActions('cancel'),
      accept: relationsActions('accept'),
      discard: relationsActions('discard'),
      unfriend: relationsActions('unfriend')
    }
  })
}
