const _ = require('builders/utils')
const { makeUrl } = require('./helpers')
const { createItemsNote, findFullRangeFromActivities } = require('./format_items_activities')
const items_ = require('controllers/items/lib/items')

module.exports = async (activitiesDocs, shelfId, name) => {
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
