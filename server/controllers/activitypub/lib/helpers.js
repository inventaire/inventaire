const CONFIG = require('config')
const host = CONFIG.fullPublicHost()
const qs = require('querystring')
const { isEntityUri, isUsername } = require('lib/boolean_validations')
const error_ = require('lib/error/error')

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

const getActorTypeFromName = name => {
  if (isEntityUri(getEntityUriFromActorName(name))) return 'entity'
  else if (name.startsWith('shelf-')) return 'shelf'
  else if (isUsername(name)) return 'user'
  else throw error_.notFound({ name })
}

module.exports = {
  makeUrl,
  getEntityActorName,
  getEntityUriFromActorName,
  getActivityIdFromPatchId,
  getActorTypeFromName,
  isEntityActivityId,
}
