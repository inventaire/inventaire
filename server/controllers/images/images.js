const ActionsControllers = require('lib/actions_controllers')

module.exports = {
  get: ActionsControllers({
    authentified: {
      'data-url': require('./data_url'),
      gravatar: require('./gravatar')
    }
  }),

  post: ActionsControllers({
    authentified: {
      upload: require('./upload'),
      'convert-url': require('./convert_url')
    }
  })
}
