const CONFIG = require('config')
const host = CONFIG.fullPublicHost()
const qs = require('querystring')

module.exports = ({ origin, endpoint, params }) => {
  origin = origin || host
  endpoint = endpoint || '/api/activitypub'
  let url = `${origin}${endpoint}`
  if (params) url = `${url}?${qs.stringify(params)}`
  return url
}
