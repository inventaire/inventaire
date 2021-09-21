const _ = require('builders/utils')
const CONFIG = require('config')
const host = CONFIG.fullPublicHost()
const { i18n } = require('lib/emails/i18n/i18n')
const snapshot_ = require('controllers/items/lib/snapshot/snapshot')
const makeUrl = require('./make_url')
const items_ = require('controllers/items/lib/items')
const maxLinksToDisplay = 3

module.exports = async (activitiesDocs, user) => {
  const actor = makeUrl({ params: { action: 'actor', name: user.username } })
  const formattedActivities = await Promise.all(activitiesDocs.map(formatActivityDoc(user, actor)))
  return _.compact(formattedActivities)
}

const formatActivityDoc = (user, actor) => async activityDoc => {
  const { since, until } = activityDoc.object.items

  // TODO: fetch documents only for the first items
  const publicRangeItems = await items_.publicByOwnerAndDate({
    ownerId: user._id,
    since,
    until,
  })

  if (publicRangeItems.length === 0) return

  const firstItems = publicRangeItems.slice(0, 3)
  await Promise.all(firstItems.map(snapshot_.addToItem))
  const links = firstItems.map(buildLinkContentFromItem)
  // // itemsLength as in OrderedItems (not user's item)
  const itemsLength = publicRangeItems.length
  const object = { type: 'Note' }
  object.content = buildContent(links, user, itemsLength)

  return {
    // TODO: implement activity endpoint to make this URI publicly dereferencable,
    // as recommended by the spec, see https://www.w3.org/TR/activitypub/#obj-id
    id: `${host}/api/activitypub?action=activity&id=${activityDoc._id}`,
    type: 'Create',
    object,
    actor,
    to: [],
    cc: [ 'https://www.w3.org/ns/activitystreams#Public' ],
    attachment: _.compact(firstItems.map(buildAttachement))
  }
}

const buildLinkContentFromItem = item => {
  return {
    text: item.snapshot['entity:title'],
    url: `${host}/items/${item._id}`
  }
}

const buildContent = (links, user, itemsLength) => {
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

const buildAttachement = item => {
  const imageUrl = item.snapshot['entity:image']
  if (!imageUrl) return
  return {
    type: 'Document',
    mediaType: 'image/jpeg',
    url: `${host}${imageUrl}`,
  }
}
