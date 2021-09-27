const error_ = require('lib/error/error')
const user_ = require('controllers/user/lib/user')
const { byActorName, getActivitiesCountByUsername } = require('controllers/activitypub/lib/activities')
const makeUrl = require('./lib/make_url')
const formatUserItemsActivities = require('./lib/format_user_items_activities')
const { isEntityUri, isUsername } = require('lib/boolean_validations')
const getEntityByUri = require('controllers/entities/lib/get_entity_by_uri')
const patches_ = require('controllers/entities/lib/patches')
const formatEntityPatchesActivities = require('./lib/format_entity_patches_activities')

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
  if (isEntityUri(name)) {
    return getEntityActivities(params)
  } else if (isUsername(name)) {
    return getUserActivities(params)
  } else {
    throw error_.new('invalid name', 400, { name })
  }
}

const getEntityActivities = async ({ name: uri, offset, limit }) => {
  const entity = await getEntityByUri({ uri })
  if (!entity) throw error_.notFound({ uri })
  const fullOutboxUrl = makeUrl({ params: { action: 'outbox', name: uri } })
  const baseOutbox = {
    '@context': [ 'https://www.w3.org/ns/activitystreams' ],
    id: fullOutboxUrl,
    type: 'OrderedCollection',
    first: `${fullOutboxUrl}&offset=0`,
    next: `${fullOutboxUrl}&offset=0`
  }
  if (offset == null) {
    baseOutbox.totalItems = await patches_.getCountByClaimValue(uri)
    return baseOutbox
  } else {
    return buildPaginatedEntityOutbox(entity, offset, limit, baseOutbox)
  }
}

const getUserActivities = async ({ name, offset, limit }) => {
  const user = await user_.findOneByUsername(name)
  if (!user || !user.fediversable) throw error_.notFound({ name })
  const fullOutboxUrl = makeUrl({ params: { action: 'outbox', name: user.stableUsername } })
  const baseOutbox = {
    '@context': [ 'https://www.w3.org/ns/activitystreams' ],
    id: fullOutboxUrl,
    type: 'OrderedCollection',
    first: `${fullOutboxUrl}&offset=0`,
    next: `${fullOutboxUrl}&offset=0`
  }
  if (offset == null) {
    // Mimick Mastodon, which only indicates the totalItems count when fetching
    // type=OrderedCollection page
    baseOutbox.totalItems = await getActivitiesCountByUsername(user.stableUsername)
    return baseOutbox
  } else {
    return buildPaginatedUserOutbox(user, offset, limit, baseOutbox)
  }
}

module.exports = {
  sanitization,
  controller,
  track: [ 'activitypub', 'outbox' ]
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
