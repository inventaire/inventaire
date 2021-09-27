const _ = require('builders/utils')
const { activitiesDebounceTime } = require('config')
const radio = require('lib/radio')
const user_ = require('controllers/user/lib/user')
const { postActivityToActorFollowersInboxes } = require('./post_activity')
const { byActorName, createActivity } = require('./activities')
const formatUserItemsActivities = require('./format_user_items_activities')

const debouncedActivities = {}

const createDebouncedActivity = async userId => {
  delete debouncedActivities[userId]
  const user = await user_.byId(userId)
  if (!user.fediversable) return
  const { stableUsername } = user
  const [ lastUserActivity ] = await byActorName({ name: stableUsername, limit: 1 })
  const yesterdayTime = Date.now() - (24 * 60 * 60 * 1000)
  const since = lastUserActivity?.updated || yesterdayTime

  const activityDoc = await createActivity({
    type: 'Create',
    actor: { name: stableUsername },
    object: { items: { since, until: Date.now() } },
  })

  const [ activity ] = await formatUserItemsActivities([ activityDoc ], user)

  if (!activity) return

  await postActivityToActorFollowersInboxes({ activity, actorName: user.stableUsername })
}

const _createDebouncedActivity = userId => () => {
  createDebouncedActivity(userId)
  .catch(_.Error('create_activities_on_items_updates err'))
}

module.exports = () => {
  radio.on('user:inventory:update', userId => {
    if (!debouncedActivities[userId]) {
      debouncedActivities[userId] = _.debounce(_createDebouncedActivity(userId), activitiesDebounceTime)
    }
    return debouncedActivities[userId]()
  })
}
