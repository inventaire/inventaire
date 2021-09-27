const _ = require('builders/utils')
const radio = require('lib/radio')
const formatEntityPatchesActivities = require('./format_entity_patches_activities')
const { postActivityToActorFollowersInboxes } = require('./post_activity')

module.exports = () => {
  radio.on('patch:created', _deliverEntityActivitiesFromPatch)
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
