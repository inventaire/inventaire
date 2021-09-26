const _ = require('builders/utils')
const makeUrl = require('./make_url')
const { createItemsNote, findFullRangeFromActivities } = require('./format_items_activities')
const items_ = require('controllers/items/lib/items')

module.exports = async (activitiesDocs, shelf, name) => {
  const actor = makeUrl({ params: { action: 'actor', name } })
  const parentLink = `/shelves/${shelf._id}`
  const { since, until } = findFullRangeFromActivities(activitiesDocs)
  const allActivitiesItems = await items_.publicByShelfAndDate({
    shelf: shelf._id,
    since,
    until,
  })

  const formattedActivities = await Promise.all(activitiesDocs.map(createItemsNote({ allActivitiesItems, name, actor, parentLink })))
  return _.compact(formattedActivities)
}
