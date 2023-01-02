import dbFactory from '#db/couchdb/base'
import { firstDoc } from '#lib/couch'
import { assert_ } from '#lib/utils/assert_types'
import Activity from '#models/activity'

const db = dbFactory('activities')

// activities are stored as documents in order to allow
// grouping items (and entities) under the same activity, this
// way ensures activities consistency which allows pagination based on offsets

export const activityById = db.get
export const activitiesByIds = db.byIds
export const deleteActivityById = db.delete

export async function getFollowActivitiesByObject (name) {
  return db.viewByKey('followActivitiesByObject', name)
}

export async function createActivity (newActivity) {
  const activity = Activity.create(newActivity)
  return db.postAndReturn(activity)
}

export async function activitiesByActorName ({ name, limit = 10, offset = 0 }) {
  assert_.string(name)
  return db.viewCustom('byActorNameAndDate', {
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

export function activitiesByExternalId (externalId) {
  return db.viewByKey('byExternalId', externalId)
  .then(firstDoc)
}
