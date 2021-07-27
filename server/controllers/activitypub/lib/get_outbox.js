const _ = require('builders/utils')
const { byUsername } = require('controllers/activitypub/lib/activities')
const makeUrl = require('./make_url')
const formatActivities = require('./format_activities')

module.exports = async (params, targetUser) => {
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
  const activities = await byUsername(username)
  const res = await formatActivities(activities, targetUser)
  _.extend(outbox, res)
  return outbox
}
