const activities_ = require('./lib/activities')
const formatUserItemsActivities = require('./lib/format_user_items_activities')
const { findOneByUsername } = require('controllers/user/lib/user')

const sanitization = {
  id: {}
}

const controller = async ({ id }) => {
  const activityDoc = await activities_.byId(id)
  const { name } = activityDoc.actor
  const user = await findOneByUsername(name)
  const [ activity ] = await formatUserItemsActivities([ activityDoc ], user)
  return activity
}

module.exports = {
  sanitization,
  controller,
}
