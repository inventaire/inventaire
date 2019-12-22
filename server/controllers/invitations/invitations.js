const __ = require('config').universalPath
const ActionsControllers = __.require('lib', 'actions_controllers')

module.exports = {
  post: ActionsControllers({
    authentified: {
      'by-emails': require('./by_emails')
    }
  })
}
