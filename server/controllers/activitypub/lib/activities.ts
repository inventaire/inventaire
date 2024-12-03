import { dbFactory } from '#db/couchdb/base'
import { assert_ } from '#lib/utils/assert_types'
import { createActivityDoc } from '#models/activity'
import type { ActivityDoc, ActivityId } from '#types/activity'

const db = await dbFactory('activities')

// activities are stored as documents in order to allow
// grouping items (and entities) under the same activity, this
// way ensures activities consistency which allows pagination based on offsets

export const getActivityById = (id: ActivityId) => db.get<ActivityDoc>(id)
export const getActivitiesByIds = db.byIds<ActivityDoc>
export const deleteActivityById = db.delete

export async function getFollowActivitiesByObject (name: string) {
  return db.getDocsByViewKey<ActivityDoc>('followActivitiesByObject', name)
}

export async function createActivity (newActivity) {
  const activity = createActivityDoc(newActivity)
  const createdActivity = await db.postAndReturn(activity)
  return createdActivity as ActivityDoc
}

export async function getActivitiesByActorName ({ name, limit = 10, offset = 0 }: { name: string, limit?: number, offset?: number }) {
  assert_.string(name)
  return db.getDocsByViewQuery<ActivityDoc>('byActorNameAndDate', {
    limit,
    skip: offset,
    startkey: [ name, Date.now() ],
    endkey: [ name, 0 ],
    descending: true,
    include_docs: true,
    reduce: false,
  })
}

export async function getActivitiesCountByName (name: string) {
  assert_.string(name)
  const res = await db.view('activities', 'byActorNameAndDate', {
    startkey: [ name, 0 ],
    endkey: [ name, Date.now() ],
    group_level: 1,
  })
  return (res.rows[0]?.value || 0) as number
}

export function getActivityByExternalId (externalId: string) {
  return db.findDocByViewKey<ActivityDoc>('byExternalId', externalId)
}
