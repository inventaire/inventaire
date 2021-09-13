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
  return _.compact(activitiesDocs.map(formatActivity(user, actor, items)))
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

const formatActivity = (user, actor, itemsWithSnapshots) => activity => {
  const { _id } = activity
  let { object } = activity
  const items = _.pick(itemsWithSnapshots, object.itemsIds)
  if (_.isEmpty(items)) return null
  object = { type: 'Note' }
  object.content = buildItemsContent(items, user)
  return { _id, type: 'Create', object, actor }
}

const buildItemsContent = (items, user) => {
  const { lang: userLang, username } = user
  const itemsAry = Object.values(items)
  const itemsLength = itemsAry.length
  const maxItemsToDisplay = 3
  const firstThreeItems = itemsAry.slice(0, maxItemsToDisplay)

  const text = i18n(userLang, 'create_items_activity', { username })
  let html = `<p>${text} `
  const links = firstThreeItems.map(item => {
    const url = `${host}/items/${item._id}`
    const linkText = item.snapshot['entity:title']
    const link = `<a href="${url}" rel="nofollow noopener noreferrer" target="_blank">${linkText}</a>`
    return link
  })
  html += links.join(', ')
  if (itemsLength > maxItemsToDisplay) {
    const and = ' ' + i18n(userLang, 'and') + ' '
    html += and
    const more = i18n(userLang, 'x_more_books_to_inventory', { itemsLength: itemsLength - maxItemsToDisplay })
    const moreLink = `<a href="${host}/inventory/${username}" rel="nofollow noopener noreferrer" target="_blank">${more}</a>`
    html += moreLink
  }
  html += '</p>'
  return html
}
