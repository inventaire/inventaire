const _ = require('builders/utils')
const error_ = require('lib/error/error')
const user_ = require('controllers/user/lib/user')
const { byUsername } = require('controllers/activitypub/lib/activities')
const makeUrl = require('./lib/make_url')
const formatActivities = require('./lib/format_activities')

const sanitization = {
  name: {},
  offset: {
    optional: true,
    default: null
  }
}

const controller = async params => {
  const { name } = params
  const user = await user_.findOneByUsername(name)
  if (!user || !user.fediversable) throw error_.notFound({ name })
  return getOutbox(params, user)
}

module.exports = {
  sanitization,
  controller,
  track: [ 'activitypub', 'outbox' ]
}

const getOutbox = async (params, targetUser) => {
  const { name, offset } = params
  const fullOutboxUrl = makeUrl({ params: { action: 'outbox', name } })
  const totalPublicItems = targetUser.snapshot.public['items:count']
  const baseOutbox = {
    id: fullOutboxUrl,
    type: 'OrderedCollection',
    totalItems: totalPublicItems,
    first: `${fullOutboxUrl}&offset=0`
  }
  if (offset != null && offset >= 0) {
    return buildPaginatedOutbox(targetUser, offset, baseOutbox)
  }
  return baseOutbox
}

const buildPaginatedOutbox = async (targetUser, offset, outbox) => {
  const { id: fullOutboxUrl } = outbox
  outbox.type = 'OrderedCollectionPage'
  outbox.partOf = fullOutboxUrl
  outbox.next = `${fullOutboxUrl}&offset=${offset + 10}`
  const { username } = targetUser
  const rawActivities = await byUsername(username)
  const activities = await formatActivities(rawActivities, targetUser)
  _.extend(outbox, {
    totalItems: activities.length,
    orderedItems: activities
  })
  return outbox
}
