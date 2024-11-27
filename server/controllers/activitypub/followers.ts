import { getFollowActivitiesCount, getFollowActivitiesByObject } from '#controllers/activitypub/lib/activities'
import { getEntityActorName } from '#controllers/activitypub/lib/helpers'
import { isEntityUri, isUsername } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import type { OrderedCollection } from '#types/activity'
import type { AbsoluteUrl } from '#types/common'
import type { Req, Res } from '#types/server'
import { makeUrl, getEntityUriFromActorName, context, setActivityPubContentType } from './lib/helpers.js'
import { validateUser, validateShelf, validateEntity } from './lib/validations.js'

const sanitization = {
  name: {},
  offset: {
    optional: true,
    default: null,
  },
  limit: {
    optional: true,
    default: 10,
  },
}

async function controller (params, req: Req, res: Res) {
  const { name: paramsName, offset, limit } = params
  let name
  setActivityPubContentType(res)
  if (isEntityUri(getEntityUriFromActorName(paramsName))) {
    name = await validateAndGetEntityName(paramsName)
  } else if (paramsName.startsWith('shelf-')) {
    await validateShelf(paramsName)
    name = paramsName
  } else if (isUsername(paramsName)) {
    name = await validateAndGetUserName(paramsName)
  } else {
    throw newError('invalid name', 400, { name: paramsName })
  }
  return buildFollowers(name, offset, limit)
}

async function validateAndGetEntityName (name) {
  const { entity } = await validateEntity(name)
  const { uri } = entity
  return getEntityActorName(uri)
}

async function validateAndGetUserName (name) {
  const { user } = await validateUser(name)
  const { stableUsername } = user
  return stableUsername
}

async function buildFollowers (name, offset, limit) {
  const followersUrl = makeUrl({ params: { action: 'followers', name } })
  const baseFollowers = getFollowersBase(followersUrl)
  if (offset == null) {
    // Mimick Mastodon, which only indicates the totalItems count when fetching
    // type=OrderedCollection page
    // TODO: remove empty Activities from count? as it's otherwise surprising
    // to find 0 Followers, when the OrderedCollection says there are Followers
    baseFollowers.totalItems = await getFollowActivitiesCount(name)
    return baseFollowers
  } else {
    return buildPaginatedFollowers(name, offset, limit, baseFollowers)
  }
}

function getFollowersBase (url: AbsoluteUrl) {
  const orderedCollection: OrderedCollection = {
    '@context': context,
    id: url,
    type: 'OrderedCollection',
    first: `${url}&offset=0`,
    next: `${url}&offset=0`,
  }
  return orderedCollection
}

async function buildPaginatedFollowers (name, offset, limit, followersObj) {
  const { id: followersUrl } = followersObj
  followersObj.type = 'OrderedCollectionPage'
  followersObj.partOf = followersUrl
  followersObj.next = `${followersUrl}&offset=${offset + limit}`
  const activitiesDocs = await getFollowActivitiesByObject({ name, limit, offset })
  followersObj.orderedItems = await activitiesDocs.map(activity => activity.actor.uri)
  return followersObj
}

export default { sanitization, controller }
