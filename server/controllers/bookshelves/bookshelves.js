const __ = require('config').universalPath
const ActionsControllers = __.require('lib', 'actions_controllers')

module.exports = {
  get: ActionsControllers({
    authentified: {
      'by-ids': require('./by_ids')
    }
  }),
  post: ActionsControllers({
    authentified: {
      create: require('./create')
    }
  })
}
