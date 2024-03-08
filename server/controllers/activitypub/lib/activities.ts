import dbFactory from '#db/couchdb/base'
import { assert_ } from '#lib/utils/assert_types'
import { createActivityDoc } from '#models/activity'
import type { Activity, ActivityId } from '#types/activity'

const db = await dbFactory('activities')

// activities are stored as documents in order to allow
// grouping items (and entities) under the same activity, this
// way ensures activities consistency which allows pagination based on offsets

export const getActivityById = (id: ActivityId) => db.get<Activity>(id)
export const getActivitiesByIds = db.byIds<Activity>
export const deleteActivityById = db.delete

export async function getFollowActivitiesByObject (name) {
  return db.getDocsByViewKey<Activity>('followActivitiesByObject', name)
}

export async function createActivity (newActivity) {
  const activity = createActivityDoc(newActivity)
  return db.postAndReturn(activity)
}

export async function getActivitiesByActorName ({ name, limit = 10, offset = 0 }) {
  assert_.string(name)
  return db.getDocsByViewQuery<Activity>('byActorNameAndDate', {
    limit,
    skip: offset,
    startkey: [ name, Date.now() ],
    endkey: [ name, 0 ],
    descending: true,
    include_docs: true,
    reduce: false,
  })
}

export async function getActivitiesCountByName (name) {
  assert_.string(name)
  const res = await db.view('activities', 'byActorNameAndDate', {
    startkey: [ name, 0 ],
    endkey: [ name, Date.now() ],
    group_level: 1,
  })
  return res.rows[0]?.value || 0
}

export function getActivityByExternalId (externalId) {
  return db.findDocByViewKey<Activity>('byExternalId', externalId)
}
