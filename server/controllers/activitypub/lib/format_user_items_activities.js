const _ = require('builders/utils')
const makeUrl = require('./make_url')
const createItemsNote = require('./create_items_note')

module.exports = async (activitiesDocs, user) => {
  const { stableUsername: name } = user
  const actor = makeUrl({ params: { action: 'actor', name } })
  const parentLink = `/inventory/${name}`
  const { lang } = user
  const formattedActivities = await Promise.all(activitiesDocs.map(createItemsNote({ user, lang, actor, parentLink })))
  return _.compact(formattedActivities)
}
