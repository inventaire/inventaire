import CONFIG from 'config'
import { compact, map, max, min } from 'lodash-es'
import { context } from '#controllers/activitypub/lib/helpers'
import { addSnapshotToItem } from '#controllers/items/lib/snapshot/snapshot'
import { i18n } from '#lib/emails/i18n/i18n'

const host = CONFIG.getPublicOrigin()
const maxLinksToDisplay = 3

export const createItemsNote = ({ allActivitiesItems, lang, name, actor, parentLink }) => async activityDoc => {
  const { since, until } = activityDoc.object.items
  // todo: pre-sorting the items per range
  const publicRangeItems = allActivitiesItems.filter(itemsWithinActivityRange(since, until))

  if (publicRangeItems.length === 0) return

  const firstItems = publicRangeItems.slice(0, 3)
  await Promise.all(firstItems.map(addSnapshotToItem))
  const links = firstItems.map(buildLinkContentFromItem)
  // itemsLength as in OrderedItems (not user's item)
  const itemsLength = publicRangeItems.length

  const id = `${host}/api/activitypub?action=activity&id=${activityDoc._id}`

  const object = {
    id,
    type: 'Note',
    content: buildContent({ links, name, lang, itemsLength, parentLink }),
    published: new Date(until).toISOString(),
    attachment: compact(firstItems.map(buildAttachement)),
  }
  return {
    id: `${id}#create`,
    '@context': context,
    type: 'Create',
    object,
    actor,
    to: 'Public',
  }
}

export function findFullRangeFromActivities (activitiesDocs) {
  return {
    since: min(map(activitiesDocs, 'object.items.since')),
    until: max(map(activitiesDocs, 'object.items.until')),
  }
}

const itemsWithinActivityRange = (since, until) => item => item.created > since && item.created < until

const buildLinkContentFromItem = item => {
  const content = {
    text: item.snapshot['entity:title'],
    url: `${host}/items/${item._id}`,
  }
  const { details } = item
  if (details) content.details = details
  return content
}

const buildContent = ({ links, name, lang = 'en', itemsLength, parentLink }) => {
  let html = `<p>${i18n(lang, 'create_items_activity', { name })} `
  const htmlLinks = links.map(link => {
    return `<a href="${link.url}" rel="nofollow noopener noreferrer" target="_blank">${link.text}</a>`
  })
  html += htmlLinks.join(', ')
  if (itemsLength > maxLinksToDisplay) {
    const url = `${host}${parentLink}`
    const moreLink = i18n(lang, 'and_x_more_books_to_inventory', { itemsLength: itemsLength - maxLinksToDisplay, link: url })
    html += moreLink
  }
  if (links.length === 1) {
    const firstLinkDetails = links[0].details
    if (firstLinkDetails) html += `\n${firstLinkDetails}`
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
