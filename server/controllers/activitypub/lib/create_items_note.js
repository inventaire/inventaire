const _ = require('builders/utils')
const CONFIG = require('config')
const host = CONFIG.fullPublicHost()
const { i18n } = require('lib/emails/i18n/i18n')
const snapshot_ = require('controllers/items/lib/snapshot/snapshot')
const items_ = require('controllers/items/lib/items')
const maxLinksToDisplay = 3

module.exports = ({ shelf, user, lang, name, actor, parentLink }) => async activityDoc => {
  const { since, until } = activityDoc.object.items
  let publicRangeItems
  if (shelf) {
    publicRangeItems = await items_.publicByShelfAndDate({
      shelf: shelf._id,
      since,
      until,
    })
  } else if (user) {
    // TODO: fetch documents only for the first items
    publicRangeItems = await items_.publicByOwnerAndDate({
      ownerId: user._id,
      since,
      until,
    })
  }

  if (publicRangeItems.length === 0) return

  const firstItems = publicRangeItems.slice(0, 3)
  await Promise.all(firstItems.map(snapshot_.addToItem))
  const links = firstItems.map(buildLinkContentFromItem)
  // // itemsLength as in OrderedItems (not user's item)
  const itemsLength = publicRangeItems.length

  const id = `${host}/api/activitypub?action=activity&id=${activityDoc._id}`

  const object = {
    id,
    type: 'Note',
    content: buildContent({ links, name, lang, itemsLength, parentLink }),
    published: new Date(until).toISOString(),
    attachment: _.compact(firstItems.map(buildAttachement)),
  }
  return {
    id: `${id}#create`,
    type: 'Create',
    object,
    actor,
    to: 'Public',
  }
}

const buildLinkContentFromItem = item => {
  return {
    text: item.snapshot['entity:title'],
    url: `${host}/items/${item._id}`
  }
}

const buildContent = ({ links, name, lang = 'en', itemsLength, parentLink }) => {
  let html = `<p>${i18n(lang, 'create_items_activity', { name })} `
  const htmlLinks = links.map(link => {
    return `<a href="${link.url}" rel="nofollow noopener noreferrer" target="_blank">${link.text}</a>`
  })
  html += htmlLinks.join(', ')
  if (itemsLength > maxLinksToDisplay) {
    const and = ' ' + i18n(lang, 'and') + ' '
    html += and
    const more = i18n(lang, 'x_more_books_to_inventory', { itemsLength: itemsLength - maxLinksToDisplay })
    const moreLink = `<a href="${host}${parentLink}" rel="nofollow noopener noreferrer" target="_blank">${more}</a>`
    html += moreLink
  }
  html += '</p>'
  return html
}

const buildAttachement = item => {
  const imageUrl = item.snapshot['entity:image']
  if (!imageUrl) return
  return {
    type: 'Image',
    mediaType: 'image/jpeg',
    url: `${host}${imageUrl}`,
  }
}
