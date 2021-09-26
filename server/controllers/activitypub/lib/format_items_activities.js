const _ = require('builders/utils')
const CONFIG = require('config')
const host = CONFIG.fullPublicHost()
const { i18n } = require('lib/emails/i18n/i18n')
const snapshot_ = require('controllers/items/lib/snapshot/snapshot')
const maxLinksToDisplay = 3

module.exports = {
  createItemsNote: ({ allActivitiesItems, lang, name, actor, parentLink }) => async activityDoc => {
    const { since, until } = activityDoc.object.items
    const publicRangeItems = allActivitiesItems.filter(itemsWithinActivityRange(since, until))

    if (publicRangeItems.length === 0) return

    const firstItems = publicRangeItems.slice(0, 3)
    await Promise.all(firstItems.map(snapshot_.addToItem))
    const links = firstItems.map(buildLinkContentFromItem)
    // itemsLength as in OrderedItems (not user's item)
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
  },
  findFullRangeFromActivities: activitiesDocs => {
    return {
      since: _.min(_.map(activitiesDocs, 'object.items.since')),
      until: _.max(_.map(activitiesDocs, 'object.items.until'))
    }
  }

}

const itemsWithinActivityRange = (since, until) => item => item.created > since && item.created < until

const buildLinkContentFromItem = item => {
  return {
    text: item.snapshot['entity:title'],
    url: `${host}/items/${item._id}`,
    details: `\n${item.details}`
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
  if (links.length === 1) html += links[0].details
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
