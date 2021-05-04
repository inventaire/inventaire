const ActionsControllers = require('lib/actions_controllers')
const radio = require('lib/radio')
const checkImage = require('./lib/check_image')

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

radio.on('image:needs:check', checkImage)
