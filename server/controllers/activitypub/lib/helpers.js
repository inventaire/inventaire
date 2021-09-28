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
const getActivityIdFromPatchId = (patchId, rowIndex) => `inv-${patchId.replace(':', '-')}-${rowIndex}`

const activityIdPattern = /^inv-[0-9a-f]{32}-\d{1,3}-\d{1,3}$/
const isEntityActivityId = activityId => activityIdPattern.test(activityId)

module.exports = {
  makeUrl,
  getEntityActorName,
  getEntityUriFromActorName,
  getActivityIdFromPatchId,
  isEntityActivityId,
}
