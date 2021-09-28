const _ = require('builders/utils')
const { postActivityToActorFollowersInboxes } = require('./post_activity')
const formatEntityPatchesActivities = require('./format_entity_patches_activities')

const deliverEntityActivitiesFromPatch = async patch => {
  try {
    const activities = await getActivitiesFromPatch(patch)
    if (activities.length === 0) return
    await Promise.all(activities.map(activity => {
      const actorName = new URL(activity.actor).searchParams.get('name')
      return postActivityToActorFollowersInboxes({ activity, actorName })
    }))
  } catch (err) {
    _.error(err, 'create_activities_on_entities_updates err')
  }
}

const getActivitiesFromPatch = async patch => {
  const rows = byClaimValueAndDate(patch)
  if (rows.length === 0) return
  return formatEntityPatchesActivities(rows)
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
          const { value } = operation
          if (typeof value === 'string' && (value.startsWith('wd:') || value.startsWith('inv:'))) {
            rows.push({ id, key: [ operation.value, doc.timestamp ], value: property })
          }
        } else {
          for (const subvalue of operation.value) {
            if (typeof subvalue === 'string' && (subvalue.startsWith('wd:') || subvalue.startsWith('inv:'))) {
              rows.push({ id, key: [ subvalue, doc.timestamp ], value: property })
            }
          }
        }
      }
    }
  }
  return rows
}

module.exports = {
  deliverEntityActivitiesFromPatch,
  getActivitiesFromPatch,
}
