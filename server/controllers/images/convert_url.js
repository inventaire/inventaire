const CONFIG = require('config')
const __ = CONFIG.universalPath
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const { getImageByUrl } = __.require('data', 'dataseed/dataseed')
const { enabled: dataseedEnabled } = CONFIG.dataseed

module.exports = (req, res, next) => {
  const { url } = req.body

  // If dataseed is disabled, we simply return the same url,
  // instead of converting it to an image hash
  if (!dataseedEnabled) return res.json({ url, converted: false })

  return getImageByUrl(url)
  .then(data => {
    data.converted = true
    responses_.send(res, data)
  })
  .catch(error_.Handler(req, res))
}
