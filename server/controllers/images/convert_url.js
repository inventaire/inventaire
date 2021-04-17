const responses_ = require('lib/responses')
const error_ = require('lib/error/error')
const sanitize = require('lib/sanitize/sanitize')
const { getImageByUrl } = require('data/dataseed/dataseed')
const { enabled: dataseedEnabled } = require('config').dataseed

const sanitization = {
  url: {}
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(convertUrl)
  .then(responses_.Send(res))
  .catch(error_.Handler(req, res))
}

const convertUrl = async ({ url }) => {
  // If dataseed is disabled, we simply return the same url,
  // instead of converting it to an image hash
  if (!dataseedEnabled) return { url, converted: false }
  const data = await getImageByUrl(url)
  data.converted = true
  return data
}
