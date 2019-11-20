

// Fix any style issues and re-enable lint.
// Doc: http://developer.piwik.org/api-reference/tracking-api
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { enabled, endpoint, idsite, rec } = CONFIG.piwik
const host = CONFIG.fullHost()
const placeholderUrl = '/unknown'
const requests_ = require('./requests')

const track = (req, actionArray) => {
  if (!enabled) return

  const { _id: userId, language } = req.user
  let { referer: url, 'user-agent': ua, 'accept-language': al } = req.headers
  const [ category, action, name, value ] = Array.from(actionArray)

  // a url is required so we use a placeholder if not provided in parameter
  if (!url) { url = placeholderUrl }
  // allow to pass a relative path to let this module turn it into the expected full url
  if (url[0] === '/') { url = `${host}${url}` }

  const data = {
    idsite,
    rec,
    url,
    uid: userId,
    e_c: category,
    // prefixing the action with the category
    // as Piwik don't allow multicriteria Objectifs such as
    // Category is a and Action is b
    e_a: `${category}:${action}`,
    e_n: name,
    e_v: value,
    ua: _.fixedEncodeURIComponent(ua),
    lang: language || _.fixedEncodeURIComponent(al)
  }

  requests_.get(_.buildPath(endpoint, data))
  .catch(_.Error('track error'))

  // do not return the promise as a failing track request should make the rest
  // of operations fail
}

module.exports = {
  track,
  Track: (...args) => () => track.apply(null, args)
}
