import { uploadContainersNames } from '#controllers/images/lib/containers'
import { convertAndCleanupImageUrl } from './lib/convert_and_cleanup_image_url.js'

const sanitization = {
  url: {},
  container: {
    generic: 'allowlist',
    allowlist: uploadContainersNames,
  },
} as const

export default { sanitization, controller: convertAndCleanupImageUrl }
