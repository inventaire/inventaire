const _ = require('builders/utils')
const CONFIG = require('config')
const host = CONFIG.fullPublicHost()
const { i18n } = require('lib/emails/i18n/i18n')
const snapshot_ = require('controllers/items/lib/snapshot/snapshot')
const makeUrl = require('./make_url')
const getAuthorizedItems = require('controllers/items/lib/get_authorized_items')

module.exports = async (activitiesDocs, user) => {
  const actor = formatActorUrl(user.username)
  // get all users items in order to drop activities only with private items
  // and still serve all possible activities
  const items = await getItemsByActivities(activitiesDocs, user, actor)
  const activities = _.compact(activitiesDocs.map(formatActivity(user.lang, actor, items)))
  return {
    totalItems: activities.length,
    orderedItems: activities
  }
}

const getItemsByActivities = async (activities, user, actor) => {
  // todo: enhance getAuthorizedItems to accept an actorUrl instead of a reqUserId
  return getAuthorizedItems.byUser(user._id)
  .then(items => Promise.all(items.map(snapshot_.addToItem)))
  .then(_.KeyBy('_id'))
}

const formatActorUrl = username => {
  const actor = {}
  actor.id = makeUrl({ params: { action: 'actor', name: username } })
  actor.type = 'Person'
  return actor
}

const formatActivity = (userLang, actor, itemsWithSnapshots) => activity => {
  const { _id } = activity
  let { object } = activity
  const items = _.pick(itemsWithSnapshots, object.itemsIds)
  if (_.isEmpty(items)) return null
  object = { type: 'Note' }
  const text = i18n(userLang, 'create_items_activity', null, 'i18nActivities')
  object.content = buildItemsContent(items, text)
  return { _id, type: 'Create', object, actor }
}

const buildItemsContent = (items, text) => {
  let html = `<p>${text}<p>`
  Object.values(items).forEach(item => {
    const url = `${host}/items/${item._id}`
    const linkText = item.snapshot['entity:title']
    const link = `<a href="${url}" rel="nofollow noopener noreferrer" target="_blank">${linkText}</a>`
    html += link
  })
  return html
}
