import error_ from '#lib/error/error'
import { byActorName, getActivitiesCountByName } from '#controllers/activitypub/lib/activities'
import { isEntityUri, isUsername } from '#lib/boolean_validations'
import patches_ from '#controllers/entities/lib/patches/patches'
import { makeUrl, getEntityUriFromActorName, context } from './lib/helpers.js'
import formatUserItemsActivities from './lib/format_user_items_activities.js'
import formatShelfItemsActivities from './lib/format_shelf_items_activities.js'
import formatEntityPatchesActivities from './lib/format_entity_patches_activities.js'
import { validateUser, validateShelf, validateEntity } from './lib/validations.js'

const sanitization = {
  name: {},
  offset: {
    optional: true,
    default: null
  },
  limit: {
    optional: true,
    default: 10
  },
}

const controller = async params => {
  const { name } = params
  if (isEntityUri(getEntityUriFromActorName(name))) {
    return getEntityActivities(params)
  } else if (name.startsWith('shelf-')) {
    return getShelfActivities(params)
  } else if (isUsername(name)) {
    return getUserActivities(params)
  } else {
    throw error_.new('invalid name', 400, { name })
  }
}

const getShelfActivities = async ({ name, offset, limit }) => {
  const { shelf } = await validateShelf(name)
  const fullOutboxUrl = makeUrl({ params: { action: 'outbox', name } })
  const baseOutbox = getBaseOutbox(fullOutboxUrl)
  if (offset == null) {
    baseOutbox.totalItems = await getActivitiesCountByName(name)
    return baseOutbox
  } else {
    return buildPaginatedShelfOutbox(shelf, name, offset, limit, baseOutbox)
  }
}

const getEntityActivities = async ({ name, offset, limit }) => {
  const { entity } = await validateEntity(name)
  if (!entity) throw error_.notFound({ name })
  const fullOutboxUrl = makeUrl({ params: { action: 'outbox', name: entity.actorName } })
  const baseOutbox = {
    '@context': context,
    id: fullOutboxUrl,
    type: 'OrderedCollection',
    first: `${fullOutboxUrl}&offset=0`,
    next: `${fullOutboxUrl}&offset=0`
  }
  if (offset == null) {
    baseOutbox.totalItems = await patches_.getCountByClaimValue(entity.uri)
    return baseOutbox
  } else {
    return buildPaginatedEntityOutbox(entity, offset, limit, baseOutbox)
  }
}

const getBaseOutbox = url => {
  return {
    '@context': context,
    id: url,
    type: 'OrderedCollection',
    first: `${url}&offset=0`,
    next: `${url}&offset=0`
  }
}

const getUserActivities = async ({ name, offset, limit }) => {
  const { user } = await validateUser(name)
  const fullOutboxUrl = makeUrl({ params: { action: 'outbox', name: user.stableUsername } })
  const baseOutbox = {
    '@context': context,
    id: fullOutboxUrl,
    type: 'OrderedCollection',
    first: `${fullOutboxUrl}&offset=0`,
    next: `${fullOutboxUrl}&offset=0`
  }
  if (offset == null) {
    // Mimick Mastodon, which only indicates the totalItems count when fetching
    // type=OrderedCollection page
    // TODO: remove empty activities from count? as it's otherwise surprising
    // to find 0 activities, when the OrderedCollection says there are activities
    baseOutbox.totalItems = await getActivitiesCountByName(user.stableUsername)
    return baseOutbox
  } else {
    return buildPaginatedUserOutbox(user, offset, limit, baseOutbox)
  }
}

export default {
  sanitization,
  controller,
}

const buildPaginatedUserOutbox = async (user, offset, limit, outbox) => {
  const { id: fullOutboxUrl } = outbox
  outbox.type = 'OrderedCollectionPage'
  outbox.partOf = fullOutboxUrl
  outbox.next = `${fullOutboxUrl}&offset=${offset + limit}`
  const { stableUsername } = user
  const activitiesDocs = await byActorName({ name: stableUsername, offset, limit })
  outbox.orderedItems = await formatUserItemsActivities(activitiesDocs, user)
  return outbox
}

const buildPaginatedShelfOutbox = async (shelf, name, offset, limit, outbox) => {
  const { id: fullOutboxUrl } = outbox
  outbox.type = 'OrderedCollectionPage'
  outbox.partOf = fullOutboxUrl
  outbox.next = `${fullOutboxUrl}&offset=${offset + limit}`
  const activitiesDocs = await byActorName({ name, offset, limit })
  outbox.orderedItems = await formatShelfItemsActivities(activitiesDocs, shelf._id, name)
  return outbox
}

const buildPaginatedEntityOutbox = async (entity, offset, limit, outbox) => {
  const { id: fullOutboxUrl } = outbox
  outbox.type = 'OrderedCollectionPage'
  outbox.partOf = fullOutboxUrl
  outbox.next = `${fullOutboxUrl}&offset=${offset + limit}`
  const { uri } = entity
  const rows = await patches_.byClaimValue(uri, offset, limit)
  outbox.orderedItems = await formatEntityPatchesActivities(rows)
  return outbox
}
