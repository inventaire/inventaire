const CONFIG = require('config')
const host = CONFIG.fullPublicHost()
const qs = require('querystring')

const makeUrl = ({ origin, endpoint, params }) => {
  origin = origin || host
  endpoint = endpoint || '/api/activitypub'
  let url = `${origin}${endpoint}`
  if (params) url = `${url}?${qs.stringify(params)}`
  return url
}

const hyphenizeEntityUri = uri => uri.replace(':', '-')
const dehyphenizeEntityUri = uri => uri.replace('-', ':')

module.exports = { makeUrl, hyphenizeEntityUri, dehyphenizeEntityUri }
