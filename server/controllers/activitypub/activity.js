const activities_ = require('./lib/activities')
const formatActivitiesDocs = require('./lib/format_activities_docs')
const { findOneByUsername } = require('controllers/user/lib/user')

const sanitization = {
  id: {}
}

const controller = async ({ id }) => {
  const activityDoc = await activities_.byId(id)
  const { name } = activityDoc.actor
  const user = await findOneByUsername(name)
  const [ activity ] = await formatActivitiesDocs([ activityDoc ], user)
  return activity
}

module.exports = {
  sanitization,
  controller,
}
