const error_ = require('lib/error/error')
const user_ = require('controllers/user/lib/user')
const { byUsername } = require('controllers/activitypub/lib/activities')
const makeUrl = require('./lib/make_url')
const formatActivitiesDocs = require('./lib/format_activities_docs')

const sanitization = {
  name: {},
  offset: {
    optional: true,
    default: null
  }
}

const controller = async params => {
  const { name, offset } = params
  const user = await user_.findOneByUsername(name)
  if (!user || !user.fediversable) throw error_.notFound({ name })
  const fullOutboxUrl = makeUrl({ params: { action: 'outbox', name: user.stableUsername } })
  const totalPublicItems = user.snapshot.public['items:count']
  const baseOutbox = {
    id: fullOutboxUrl,
    type: 'OrderedCollection',
    totalItems: totalPublicItems,
    first: `${fullOutboxUrl}&offset=0`
  }
  return superiorToZero(offset) ? buildPaginatedOutbox(user, offset, baseOutbox) : baseOutbox
}

module.exports = {
  sanitization,
  controller,
  track: [ 'activitypub', 'outbox' ]
}

const superiorToZero = offset => offset != null && offset >= 0

const buildPaginatedOutbox = async (user, offset, outbox) => {
  const { id: fullOutboxUrl } = outbox
  outbox.type = 'OrderedCollectionPage'
  outbox.partOf = fullOutboxUrl
  outbox.next = `${fullOutboxUrl}&offset=${offset + 10}`
  const { username } = user
  const activitiesDocs = await byUsername(username)
  const activities = await formatActivitiesDocs(activitiesDocs, user)
  Object.assign(outbox, {
    totalItems: activities.length,
    orderedItems: activities
  })
  return outbox
}
