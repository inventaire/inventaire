const CONFIG = require('config')
// Doc: http://developer.piwik.org/api-reference/tracking-api
const _ = require('builders/utils')
const { buildUrl } = require('lib/utils/url')
const { enabled, endpoint, idsite, rec } = CONFIG.piwik
const origin = CONFIG.getPublicOrigin()
const placeholderUrl = '/unknown'
const requests_ = require('./requests')

const track = (req = {}, actionArray) => {
  if (!enabled) return

  const { user = {}, headers = {} } = req
  const { _id: userId, language } = user
  const { 'user-agent': ua, 'accept-language': al } = headers
  let { referer: url } = headers
  const [ category, action, name, value ] = actionArray

  // a url is required so we use a placeholder if not provided in parameter
  if (!url) url = placeholderUrl
  // allow to pass a relative path to let this module turn it into the expected full url
  if (url[0] === '/') url = `${origin}${url}`

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
    ua,
    lang: language || al,
  }

  requests_.get(buildUrl(endpoint, data), { parseJson: false })
  .catch(_.Error('track error'))

  // Do not return the promise as a failing track request
  // should not make the rest of operations fail
}

const trackActor = (actorUri, actionArray) => {
  const pseudoReq = {
    user: { _id: actorUri }
  }
  track(pseudoReq, actionArray)
}

module.exports = {
  track,
  Track: (...args) => res => {
    // Do not wait for the track action
    track(...args)
    return res
  },
  trackActor,
}
