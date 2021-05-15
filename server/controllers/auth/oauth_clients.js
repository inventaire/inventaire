const ActionsControllers = require('lib/actions_controllers')

module.exports = {
  get: ActionsControllers({
    public: {
      'by-ids': require('./clients_by_ids'),
    }
  })
}
