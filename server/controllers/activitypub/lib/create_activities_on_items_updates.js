const _ = require('builders/utils')
const { activitiesDebounceTime } = require('config')
const radio = require('lib/radio')
const user_ = require('controllers/user/lib/user')
const { postActivityToUserFollowersInboxes } = require('./post_activity')
const { byUsername, createActivity } = require('./activities')

const debouncedActivities = {}

const createDebouncedActivity = userId => async () => {
  delete debouncedActivities[userId]
  const user = await user_.byId(userId)
  if (!user.fediversable) return
  const { stableUsername } = user
  const [ lastUserActivity ] = await byUsername({ username: stableUsername, limit: 1 })
  const since = lastUserActivity?.updated || 0
  return createActivity({
    type: 'Create',
    actor: { name: stableUsername },
    object: { items: { since, until: Date.now() } },
  })
  .then(postActivityToUserFollowersInboxes(user))
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
