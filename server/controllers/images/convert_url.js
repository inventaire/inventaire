const convertAndCleanupImageUrl = require('./lib/convert_and_cleanup_image_url')
const { uploadContainersNames } = require('controllers/images/lib/containers')

const sanitization = {
  url: {},
  container: {
    generic: 'allowlist',
    allowlist: uploadContainersNames
  },
}

module.exports = { sanitization, controller: convertAndCleanupImageUrl }
