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

const getEntityActorName = uri => uri.replace(':', '-')
const getEntityUriFromActorName = name => name.replace('-', ':')

module.exports = { makeUrl, getEntityActorName, getEntityUriFromActorName }
