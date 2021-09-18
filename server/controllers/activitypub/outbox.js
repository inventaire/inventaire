const error_ = require('lib/error/error')
const user_ = require('controllers/user/lib/user')
const { byUsername, getActivitiesCountByUsername } = require('controllers/activitypub/lib/activities')
const makeUrl = require('./lib/make_url')
const formatActivitiesDocs = require('./lib/format_activities_docs')

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
  const { name, offset, limit } = params
  const user = await user_.findOneByUsername(name)
  if (!user || !user.fediversable) throw error_.notFound({ name })
  const fullOutboxUrl = makeUrl({ params: { action: 'outbox', name: user.stableUsername } })
  const baseOutbox = {
    id: fullOutboxUrl,
    type: 'OrderedCollection',
    first: `${fullOutboxUrl}&offset=0`,
    next: `${fullOutboxUrl}&offset=0`
  }
  if (offset == null) {
    // Mimick Mastodon, which only indicates the totalItems count when fetching
    // type=OrderedCollection page
    baseOutbox.totalItems = await getActivitiesCountByUsername(user.username)
    return baseOutbox
  } else {
    return buildPaginatedOutbox(user, offset, limit, baseOutbox)
  }
}

module.exports = {
  sanitization,
  controller,
  track: [ 'activitypub', 'outbox' ]
}

const buildPaginatedOutbox = async (user, offset, limit, outbox) => {
  const { id: fullOutboxUrl } = outbox
  outbox.type = 'OrderedCollectionPage'
  outbox.partOf = fullOutboxUrl
  outbox.next = `${fullOutboxUrl}&offset=${offset + limit}`
  const { username } = user
  const activitiesDocs = await byUsername({ username, offset, limit })
  outbox.orderedItems = await formatActivitiesDocs(activitiesDocs, user)
  return outbox
}
