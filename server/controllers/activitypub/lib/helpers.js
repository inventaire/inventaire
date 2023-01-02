import CONFIG from 'config'
import { stringifyQuery } from '#lib/utils/url'
import { isEntityUri, isUsername } from '#lib/boolean_validations'
import error_ from '#lib/error/error'
import { unprefixify } from '#controllers/entities/lib/prefix'
import { i18n } from '#lib/emails/i18n/i18n'

const host = CONFIG.getPublicOrigin()

const makeUrl = ({ origin, endpoint, params }) => {
  origin = origin || host
  endpoint = endpoint || '/api/activitypub'
  let url = `${origin}${endpoint}`
  if (params) url = `${url}?${stringifyQuery(params)}`
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

const defaultLabel = entity => entity.labels.en || Object.values(entity.labels)[0] || entity.claims['wdt:P1476']?.[0]

const buildLink = (url, text) => {
  if (!text) text = url.split('://')[1]
  // Mimicking Mastodon
  return `<a href="${url}" rel="me nofollow noopener noreferrer" target="_blank">${text}</a>`
}

const entityUrl = uri => `${host}/entity/${uri}`

const propertyLabel = prop => i18n('en', unprefixify(prop))

const context = [
  'https://www.w3.org/ns/activitystreams',
]

export default {
  makeUrl,
  getEntityActorName,
  getEntityUriFromActorName,
  getActivityIdFromPatchId,
  getActorTypeFromName,
  isEntityActivityId,
  defaultLabel,
  entityUrl,
  propertyLabel,
  buildLink,
  context,
}
