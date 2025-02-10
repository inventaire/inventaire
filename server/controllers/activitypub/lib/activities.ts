import { dbFactory } from '#db/couchdb/base'
import { assertString } from '#lib/utils/assert_types'
import { createActivityDoc } from '#models/activity'
import type { ActivityDoc, ActivityId, ActorName } from '#types/activity'
import type { Hostname } from '#types/common'

const db = await dbFactory('activities')

// activities are stored as documents in order to allow
// grouping items (and entities) under the same activity, this
// way ensures activities consistency which allows pagination based on offsets

export const getActivityById = (id: ActivityId) => db.get<ActivityDoc>(id)
export const getActivitiesByIds = db.byIds<ActivityDoc>
export const deleteActivityById = db.delete

export async function getFollowActivitiesByObject ({ name, limit = 10, offset = 0 }: { name: ActorName, limit?: number, offset?: number }) {
  assertString(name)
  return db.getDocsByViewQuery<ActivityDoc>('followActivitiesByObject', {
    limit,
    skip: offset,
    startkey: [ name, Date.now() ],
    endkey: [ name, 0 ],
    descending: true,
    include_docs: true,
    reduce: false,
  })
}

export async function getFollowActivitiesCount (name: string) {
  assertString(name)
  const res = await db.view('activities', 'followActivitiesByObject', {
    startkey: [ name, 0 ],
    endkey: [ name, Date.now() ],
    group_level: 1,
  })
  return (res.rows[0]?.value || 0) as number
}

export async function createActivity (newActivity) {
  const activity = createActivityDoc(newActivity)
  const createdActivity = await db.postAndReturn(activity)
  return createdActivity as ActivityDoc
}

export async function getActivitiesByActorName ({ name, limit = 10, offset = 0 }: { name: string, limit?: number, offset?: number }) {
  assertString(name)
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
  assertString(name)
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

export async function isFediverseKnownHost (hostname: Hostname) {
  const res = await db.view('activities', 'isKnownHostname', {
    key: hostname,
    limit: 1,
  })
  return res.rows.length > 0
}
