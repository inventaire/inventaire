const _ = require('builders/utils')
const { activitiesDebounceTime } = require('config')
const radio = require('lib/radio')
const items_ = require('controllers/items/lib/items')
const user_ = require('controllers/user/lib/user')
const { postActivityToUserFollowersInboxes } = require('./post_activity_to_inboxes')
const { byUsername, createActivity } = require('./activities')
const { oneDay } = require('lib/time')

const debouncedActivities = {}

const createDebouncedActivity = userId => async () => {
  delete debouncedActivities[userId]
  const user = await user_.byId(userId)
  if (!user.fediversable) return
  const { username } = user
  const [ lastUserActivity ] = await byUsername({ username, limit: 1 })
  const yesterdayTime = Date.now() - oneDay
  let since
  if (lastUserActivity) {
    since = Math.max(yesterdayTime, lastUserActivity.updated)
  } else {
    since = yesterdayTime
  }
  const activityItems = await items_.recentPublicByOwner(userId, since)
  const activityItemsIds = _.map(activityItems, '_id')
  return createActivity({
    type: 'Create',
    actor: { username },
    object: { itemsIds: activityItemsIds },
  })
  .then(postActivityToUserFollowersInboxes(user))
  .catch(_.Error('create debounced activity err'))
}

module.exports = () => {
  radio.on('user:items:created', userId => {
    if (!debouncedActivities[userId]) {
      debouncedActivities[userId] = _.debounce(createDebouncedActivity(userId), activitiesDebounceTime)
    }
    return debouncedActivities[userId]()
  })
}
