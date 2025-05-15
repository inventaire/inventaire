import { methodAndActionsControllersFactory } from '#lib/actions_controllers'
import { radio } from '#lib/radio'
import type { EndpointSpecs } from '#types/api/specifications'
import convertUrl from './convert_url.js'
import dataUrl from './data_url.js'
import gravatar from './gravatar.js'
import { checkImage } from './lib/check_image.js'
import upload from './upload.js'

const methodsAndActionsControllers = {
  get: {
    authentified: {
      'data-url': dataUrl,
      gravatar,
    },
  },

  post: {
    authentified: {
      upload,
      'convert-url': convertUrl,
    },
  },
}

radio.on('image:needs:check', checkImage)

export default methodAndActionsControllersFactory(methodsAndActionsControllers)

export const specs: EndpointSpecs = {
  name: 'images',
  controllers: methodsAndActionsControllers,
}
