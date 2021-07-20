const items_ = require('controllers/items/lib/items')
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
  const items = await items_.byOwnerAndListing(targetUser._id, 'public')
  outbox.orderedItems = await formatActivities(items, targetUser)
  return outbox
}
