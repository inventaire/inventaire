const _ = require('builders/utils')
const makeUrl = require('./make_url')
const { createItemsNote, findFullRangeFromActivities } = require('./format_items_activities')
const items_ = require('controllers/items/lib/items')

module.exports = async (activitiesDocs, user) => {
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
