const responses_ = require('lib/responses')
const error_ = require('lib/error/error')
const sanitize = require('lib/sanitize/sanitize')
const convertAndCleanupImageUrl = require('./lib/convert_and_cleanup_image_url')
const containers = require('controllers/images/lib/containers')
const uploadContainersNames = Object.keys(containers)
  .filter(containerName => containers[containerName].putImage != null)

const sanitization = {
  url: {},
  container: {
    generic: 'allowlist',
    allowlist: uploadContainersNames
  },
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(convertAndCleanupImageUrl)
  .then(responses_.Send(res))
  .catch(error_.Handler(req, res))
}
