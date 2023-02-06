import ActionsControllers from '#lib/actions_controllers'
import { radio } from '#lib/radio'
import convertUrl from './convert_url.js'
import dataUrl from './data_url.js'
import gravatar from './gravatar.js'
import checkImage from './lib/check_image.js'
import upload from './upload.js'

export default {
  get: ActionsControllers({
    authentified: {
      'data-url': dataUrl,
      gravatar,
    },
  }),

  post: ActionsControllers({
    authentified: {
      upload,
      'convert-url': convertUrl,
    },
  }),
}

radio.on('image:needs:check', checkImage)
