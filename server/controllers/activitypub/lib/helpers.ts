import CONFIG from 'config'
import { unprefixify } from '#controllers/entities/lib/prefix'
import { isEntityUri, isUsername } from '#lib/boolean_validations'
import { i18n } from '#lib/emails/i18n/i18n'
import { notFoundError } from '#lib/error/error'
import { stringifyQuery } from '#lib/utils/url'

const host = CONFIG.getPublicOrigin()

interface MakeUrlArgs {
  origin?: string
  endpoint?: string
  params?: {
    action?: string
    name?: string
    offset?: number
  }
}

export function makeUrl ({ origin, endpoint, params }: MakeUrlArgs) {
  origin = origin || host
  endpoint = endpoint || '/api/activitypub'
  let url = `${origin}${endpoint}`
  if (params) url = `${url}?${stringifyQuery(params)}`
  return url
}

export const getEntityActorName = uri => uri.replace(':', '-')
export const getEntityUriFromActorName = name => name.replace('-', ':')
export const getActivityIdFromPatchId = (patchId, rowIndex) => `inv-${patchId.replace(':', '-')}-${rowIndex}`

const activityIdPattern = /^inv-[0-9a-f]{32}-\d{1,3}-\d{1,3}$/
export const isEntityActivityId = activityId => activityIdPattern.test(activityId)

export function getActorTypeFromName (name) {
  if (isEntityUri(getEntityUriFromActorName(name))) return 'entity'
  else if (name.startsWith('shelf-')) return 'shelf'
  else if (isUsername(name)) return 'user'
  else throw notFoundError({ name })
}

export const defaultLabel = entity => entity.labels.en || Object.values(entity.labels)[0] || entity.claims['wdt:P1476']?.[0]

export function buildLink (url, text) {
  if (!text) text = url.split('://')[1]
  // Mimicking Mastodon
  return `<a href="${url}" rel="me nofollow noopener noreferrer" target="_blank">${text}</a>`
}

export const entityUrl = uri => `${host}/entity/${uri}`

export const propertyLabel = prop => i18n('en', unprefixify(prop))

export const context = [
  'https://www.w3.org/ns/activitystreams',
]

export function setActivityPubContentType (res) {
  res.header('content-type', 'application/activity+json')
}
