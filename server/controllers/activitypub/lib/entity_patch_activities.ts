import { logError } from '#lib/utils/logs'
import type { CreateActivity, ActorName } from '#types/activity'
import formatEntityPatchesActivities from './format_entity_patches_activities.js'
import { postActivityToActorFollowersInboxes } from './post_activity.js'

export async function deliverEntityActivitiesFromPatch (patch) {
  try {
    const activities: CreateActivity[] = await getActivitiesFromPatch(patch)
    if (activities.length === 0) return
    await Promise.all(activities.map(activity => {
      const actorName: ActorName = new URL(activity.actor).searchParams.get('name')
      return postActivityToActorFollowersInboxes({ activity, actorName })
    }))
  } catch (err) {
    logError(err, 'create_activities_on_entities_updates err')
  }
}

export async function getActivitiesFromPatch (patch) {
  const rows = byClaimValueAndDate(patch)
  if (rows.length === 0) return []
  return formatEntityPatchesActivities(rows)
}

// Mimick server/db/couchdb/design_docs/patches.ts byClaimValueAndDate
function byClaimValueAndDate (doc) {
  const { _id: id, timestamp } = doc
  const rows = []
  for (const operation of doc.operations) {
    if (operation.op === 'add') {
      const [ , section, property, arrayIndex ] = operation.path.split('/')
      if (section === 'claims') {
        if (arrayIndex != null) {
          // Example case: { op: 'add', path: '/claims/wdt:P1104', value: [ 150 ] }
          addRow(rows, id, property, operation.value, timestamp)
        } else if (property != null) {
          // Example case: { op: 'add', path: '/claims/wdt:P50', value: [ 'wd:Q535' ] }
          for (const subvalue of operation.value) {
            addRow(rows, id, property, subvalue, timestamp)
          }
        }
        // Remaining case: { op: 'add', path: '/claims', value: { 'wdt:P31': [ 'wd:Q47461344' ] } }
        // Ignored as it's only accuring after a revert-merge, were add operations
        // would be dupplicates of previous add operations
      }
    }
  }
  return rows
}

function addRow (rows, id, property, claim, timestamp) {
  const value = typeof claim === 'object' ? claim.value : claim
  if (typeof value === 'string' && (value.startsWith('wd:') || value.startsWith('inv:'))) {
    rows.push({ id, key: [ value, timestamp ], value: property })
  }
}
