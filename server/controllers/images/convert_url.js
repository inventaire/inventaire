import { uploadContainersNames } from '#controllers/images/lib/containers'
import convertAndCleanupImageUrl from './lib/convert_and_cleanup_image_url.js'

const sanitization = {
  url: {},
  container: {
    generic: 'allowlist',
    allowlist: uploadContainersNames
  },
}

export default { sanitization, controller: convertAndCleanupImageUrl }
