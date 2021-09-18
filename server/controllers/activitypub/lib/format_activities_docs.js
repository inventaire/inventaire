const _ = require('builders/utils')
const CONFIG = require('config')
const host = CONFIG.fullPublicHost()
const { i18n } = require('lib/emails/i18n/i18n')
const snapshot_ = require('controllers/items/lib/snapshot/snapshot')
const makeUrl = require('./make_url')
const getAuthorizedItems = require('controllers/items/lib/get_authorized_items')

module.exports = async (activitiesDocs, user) => {
  const actor = makeUrl({ params: { action: 'actor', name: user.username } })
  const items = await getItemsByActivities(activitiesDocs, user, actor)
  return _.compact(activitiesDocs.map(formatActivityDoc(user, actor, items)))
}

const getItemsByActivities = async (activities, user, actor) => {
  // todo: enhance getAuthorizedItems to accept an actorUrl instead of a reqUserId
  return getAuthorizedItems.byUser(user._id)
  .then(items => Promise.all(items.map(snapshot_.addToItem)))
  .then(_.KeyBy('_id'))
}

const formatActivityDoc = (user, actor, items) => activityDoc => {
  const { _id } = activityDoc
  let { object } = activityDoc
  const maxLinksToDisplay = 3

  const { itemsIds } = object
  if (_.isEmpty(itemsIds)) return null
  // itemsLength as in OrderedItems (not user's item)
  const { itemsLength, links } = buildLinkContentFromItems(items, itemsIds, maxLinksToDisplay)

  object = { type: 'Note' }
  object.content = buildContent(links, user, maxLinksToDisplay, itemsLength)

  return {
    // TODO: implement activity endpoint to make this URI publicly dereferencable,
    // as recommended by the spec, see https://www.w3.org/TR/activitypub/#obj-id
    id: `${host}/api/activitypub?action=activity&id=${_id}`,
    type: 'Create',
    object,
    actor,
    to: [],
    cc: [ 'https://www.w3.org/ns/activitystreams#Public' ],
  }
}

const buildLinkContentFromItems = (items, objectItemsIds, maxLinksToDisplay) => {
  const objectItems = Object.values(_.pick(items, objectItemsIds))
  const firstThreeItems = objectItems.slice(0, maxLinksToDisplay)
  const links = firstThreeItems.map(item => {
    return {
      text: item.snapshot['entity:title'],
      url: `${host}/items/${item._id}`
    }
  })
  const itemsLength = objectItems.length
  return { itemsLength, links }
}

const buildContent = (links, user, maxLinksToDisplay, itemsLength) => {
  const { lang: userLang, username } = user
  let html = `<p>${i18n(userLang, 'create_items_activity', { username })} `
  const htmlLinks = links.map(link => {
    return `<a href="${link.url}" rel="nofollow noopener noreferrer" target="_blank">${link.text}</a>`
  })
  html += htmlLinks.join(', ')
  if (itemsLength > maxLinksToDisplay) {
    const and = ' ' + i18n(userLang, 'and') + ' '
    html += and
    const more = i18n(userLang, 'x_more_books_to_inventory', { itemsLength: itemsLength - maxLinksToDisplay })
    const moreLink = `<a href="${host}/inventory/${username}" rel="nofollow noopener noreferrer" target="_blank">${more}</a>`
    html += moreLink
  }
  html += '</p>'
  return html
}
