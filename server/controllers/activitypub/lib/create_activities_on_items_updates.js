const _ = require('builders/utils')
const { activitiesDebounceTime } = require('config')
const radio = require('lib/radio')
const items_ = require('controllers/items/lib/items')
const user_ = require('controllers/user/lib/user')
const { postActivityToInboxes } = require('./post_activity_to_inboxes')
const activities_ = require('./activities')

const debouncedActivities = {}

const createDebouncedActivity = userId => async () => {
  delete debouncedActivities[userId]
  const user = await user_.byId(userId)
  if (!user.fediversable) return
  const publicItems = await items_.recentPublicByOwner(userId)
  const publicItemsIds = publicItems.map(_.property('_id'))
  const { username } = user
  const activities = await activities_.byUsername(username)
  const activitiesItemsIds = _.flatMap(activities, _.property('object.itemsIds'))
  const itemsIds = _.difference(publicItemsIds, activitiesItemsIds)
  return activities_.createActivity({
    actor: { username },
    object: { itemsIds },
    type: 'Create'
  })
  .then(postActivityToInboxes(user))
  .catch(_.Error('create debounced activity err'))
}

module.exports = () => {
  radio.on('user:inventory:update', userId => {
    if (!debouncedActivities[userId]) {
      debouncedActivities[userId] = _.debounce(createDebouncedActivity(userId), activitiesDebounceTime)
    }
    return debouncedActivities[userId]()
  })
}
