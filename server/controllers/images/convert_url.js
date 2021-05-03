const responses_ = require('lib/responses')
const error_ = require('lib/error/error')
const sanitize = require('lib/sanitize/sanitize')
const convertAndCleanupImageUrl = require('./lib/convert_and_cleanup_image_url')

const sanitization = {
  url: {}
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(({ url }) => convertAndCleanupImageUrl(url))
  .then(responses_.Send(res))
  .catch(error_.Handler(req, res))
}
