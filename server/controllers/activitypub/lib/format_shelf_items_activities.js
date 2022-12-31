import _ from 'builders/utils'
import { makeUrl } from './helpers'
import { createItemsNote, findFullRangeFromActivities } from './format_items_activities'
import items_ from 'controllers/items/lib/items'

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
