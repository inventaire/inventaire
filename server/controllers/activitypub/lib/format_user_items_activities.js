import _ from 'builders/utils'
import { createItemsNote, findFullRangeFromActivities } from './format_items_activities'
import { makeUrl } from './helpers'
import items_ from 'controllers/items/lib/items'

export default async (activitiesDocs, user) => {
  if (!_.isNonEmptyArray(activitiesDocs)) return []
  const { stableUsername: name } = user
  const actor = makeUrl({ params: { action: 'actor', name } })
  const parentLink = `/inventory/${name}`
  const { lang } = user
  const { since, until } = findFullRangeFromActivities(activitiesDocs)

  const allActivitiesItems = await items_.publicByOwnerAndDate({
    ownerId: user._id,
    since,
    until,
  })

  const formattedActivities = await Promise.all(activitiesDocs.map(createItemsNote({ allActivitiesItems, lang, name, actor, parentLink })))
  return _.compact(formattedActivities)
}
