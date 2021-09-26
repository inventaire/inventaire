const _ = require('builders/utils')
const { activitiesDebounceTime } = require('config')
const radio = require('lib/radio')
const user_ = require('controllers/user/lib/user')
const { postActivityToActorFollowersInboxes } = require('./post_activity')
const { byActorName, createActivity } = require('./activities')
const formatEntityPatchesActivities = require('./format_entity_patches_activities')
const formatUserItemsActivities = require('./format_user_items_activities')
const formatShelfItemsActivities = require('./format_shelf_items_activities')

const debouncedActivities = {}

module.exports = () => {
  radio.on('user:inventory:update', userId => {
    if (!debouncedActivities[userId]) {
      debouncedActivities[userId] = _.debounce(createDebouncedActivity({ userId }), activitiesDebounceTime)
    }
    return debouncedActivities[userId]()
  })
  radio.on('shelves:update', shelvesIds => {
    Promise.all(shelvesIds.map(debounceActivities))
  })
  radio.on('patch:created', _deliverEntityActivitiesFromPatch)
}

const createDebouncedActivity = ({ userId, shelfId }) => async () => {
  let name, user
  if (userId) {
    delete debouncedActivities[userId]
    user = await user_.byId(userId)
    if (!user.fediversable) return
    name = user.stableUsername
  } else if (shelfId) {
    delete debouncedActivities[shelfId]
    // todo: use group slugify to create shelf name
    // shelf = await shelves_.byId(shelfId)
    name = `shelf:${shelfId}`
  }
  const [ lastActivity ] = await byActorName({ name, limit: 1 })
  const yesterdayTime = Date.now() - (24 * 60 * 60 * 1000)
  const since = lastActivity?.updated || yesterdayTime

  const activityDoc = await createActivity({
    type: 'Create',
    actor: { name },
    object: { items: { since, until: Date.now() } },
  })

  let activity
  if (userId) {
    [ activity ] = await formatUserItemsActivities([ activityDoc ], user)
  } else if (shelfId) {
    [ activity ] = await formatShelfItemsActivities([ activityDoc ], shelfId, name)
  }
  if (!activity) return

  return postActivityToActorFollowersInboxes({ activity, actorName: name })
}

const debounceActivities = async shelfId => {
  if (!debouncedActivities[shelfId]) {
    debouncedActivities[shelfId] = _.debounce(createDebouncedActivity({ shelfId }), activitiesDebounceTime)
  }
  return debouncedActivities[shelfId]()
}

const _deliverEntityActivitiesFromPatch = patch => {
  deliverEntityActivitiesFromPatch(patch)
  .catch(_.Error('create_activities_on_entities_updates err'))
}

const deliverEntityActivitiesFromPatch = async patch => {
  const rows = byClaimValueAndDate(patch)
  if (rows.length === 0) return
  const activities = await formatEntityPatchesActivities(rows)
  if (activities.length === 0) return
  await Promise.all(activities.map(activity => {
    const actorName = new URL(activity.actor).searchParams.get('name')
    return postActivityToActorFollowersInboxes({ activity, actorName })
  }))
}

// Mimick server/db/couchdb/design_docs/patches.json byClaimValueAndDate
const byClaimValueAndDate = doc => {
  const { _id: id } = doc
  const rows = []
  for (const operation of doc.patch) {
    if (operation.op === 'add') {
      const [ , section, property, arrayIndex ] = operation.path.split('/')
      if (section === 'claims') {
        if (arrayIndex != null) {
          if (operation.value.startsWith('wd:') || operation.value.startsWith('inv:')) {
            rows.push({ id, key: [ operation.value, doc.timestamp ], value: property })
          }
        } else {
          for (const subvalue of operation.value) {
            if (subvalue.startsWith('wd:') || subvalue.startsWith('inv:')) {
              rows.push({ id, key: [ subvalue, doc.timestamp ], value: property })
            }
          }
        }
      }
    }
  }
  return rows
}
