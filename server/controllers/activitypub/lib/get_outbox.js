const error_ = require('lib/error/error')
const user_ = require('controllers/user/lib/user')
const couch_ = require('lib/couch')
const makeUrl = require('./make_url')

module.exports = async name => {
  const user = await user_.byUsername(name)
  .then(couch_.firstDoc)
  if (!user) throw error_.notFound(name)
  if (!user.fediversable) throw error_.new('user is not on the fediverse', 404, name)
  const { username } = user
  const outboxUrl = makeUrl({ params: { action: 'outbox', name: username } })
  const totalItems = user.snapshot.public['items:count']

  return {
    id: outboxUrl,
    type: 'OrderedCollectionPage',
    totalItems,
    first: `${outboxUrl}&page=1`
  }
}
