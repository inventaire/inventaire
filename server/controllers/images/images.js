import ActionsControllers from '#lib/actions_controllers'
import radio from '#lib/radio'
import checkImage from './lib/check_image.js'

export default {
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
