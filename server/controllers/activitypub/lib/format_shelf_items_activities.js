import _ from '#builders/utils'
import items_ from '#controllers/items/lib/items'
import { makeUrl } from './helpers.js'
import { createItemsNote, findFullRangeFromActivities } from './format_items_activities.js'

export default async (activitiesDocs, shelfId, name) => {
  if (activitiesDocs.length === 0) return
  const actor = makeUrl({ params: { action: 'actor', name } })
  const parentLink = `/shelves/${shelfId}`
  const { since, until } = findFullRangeFromActivities(activitiesDocs)
  const allActivitiesItems = await items_.publicByShelfAndDate({
    shelf: shelfId,
    since,
    until,
  })

  const formattedActivities = await Promise.all(activitiesDocs.map(createItemsNote({ allActivitiesItems, name, actor, parentLink })))
  return _.compact(formattedActivities)
}
