const _ = require('builders/utils')
const makeUrl = require('./make_url')
const createItemsNote = require('./create_items_note')

module.exports = async (activitiesDocs, shelf, name) => {
  const actor = makeUrl({ params: { action: 'actor', name } })
  const parentLink = `/shelves/${shelf._id}`
  const formattedActivities = await Promise.all(activitiesDocs.map(createItemsNote({ shelf, name, actor, parentLink })))
  return _.compact(formattedActivities)
}
