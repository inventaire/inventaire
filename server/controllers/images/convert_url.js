const CONFIG = require('config')
const __ = CONFIG.universalPath
const responses_ = require('lib/responses')
const error_ = require('lib/error/error')
const { getImageByUrl } = require('data/dataseed/dataseed')
const { enabled: dataseedEnabled } = CONFIG.dataseed

module.exports = (req, res) => {
  const { url } = req.body

  // If dataseed is disabled, we simply return the same url,
  // instead of converting it to an image hash
  if (!dataseedEnabled) {
    res.json({ url, converted: false })
    return
  }

  return getImageByUrl(url)
  .then(data => {
    data.converted = true
    responses_.send(res, data)
  })
  .catch(error_.Handler(req, res))
}
