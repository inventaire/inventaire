const CONFIG = require('config')
const host = CONFIG.fullPublicHost()
const { i18n } = require('lib/emails/i18n/i18n')
const snapshot_ = require('controllers/items/lib/snapshot/snapshot')
const makeUrl = require('./make_url')

module.exports = async (items, user) => {
  const actor = formatActorUrl(user.username)
  const activities = await groupItemsByActivities(items, user, actor)
  return activities
}

const groupItemsByActivities = async (items, user, actor) => {
  const itemsWithSnapshots = await Promise.all(items.map(snapshot_.addToItem))
  // fake grouping by items, to be replaced when bulked items activities are on
  const groupedActivities = itemsWithSnapshots.map(item => { return { items: [ item ] } })
  return groupedActivities.map(formatActivity(user.language, actor))
}

const formatActorUrl = username => {
  const actor = {}
  actor.id = makeUrl({ params: { action: 'actor', name: username } })
  actor.type = 'Person'
  return actor
}

const formatActivity = (userLang, actor) => activity => {
  const { items } = activity
  const object = { type: 'Note' }
  const text = i18n(userLang, 'create_items_activity', null, 'i18nActivities')
  object.content = buildItemsContent(items, text)
  return { type: 'Create', object, actor }
}

const buildItemsContent = (items, text) => {
  let html = `<p>${text}<p>`
  items.forEach(item => {
    const url = `${host}/items/${item._id}`
    const linkText = item.snapshot['entity:title']
    const link = `<a href="${url}" rel="nofollow noopener noreferrer" target="_blank">${linkText}</a>`
    html += link
  })
  return html
}
