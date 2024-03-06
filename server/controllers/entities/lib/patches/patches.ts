import { map } from 'lodash-es'
import dbFactory from '#db/couchdb/base'
import { maxKey } from '#lib/couch'
import { oneDay } from '#lib/time'
import { assert_ } from '#lib/utils/assert_types'
import { simpleDay } from '#lib/utils/base'
import { addVersionsSnapshots } from '#models/patch'
import type { InvEntityId } from '#types/entity'
import type { Patch, PatchId } from '#types/patch'
import type { UserId } from '#types/user'

const designDocName = 'patches'

export const db = await dbFactory('patches', designDocName)

export const getPatchById = (id: PatchId) => db.get(id)

export async function getPatchesByEntityId (entityId: InvEntityId) {
  const { rows } = await db.view(designDocName, 'byEntityId', {
    startkey: [ entityId, 0 ],
    endkey: [ entityId, maxKey ],
    include_docs: true,
  })
  return map(rows, 'doc')
}

export async function getEntityLastPatches (entityId: InvEntityId, length: number = 1) {
  const { rows } = await db.view(designDocName, 'byEntityId', {
    startkey: [ entityId, maxKey ],
    endkey: [ entityId, 0 ],
    descending: true,
    include_docs: true,
    limit: length,
  })
  return map(rows, 'doc')
}

export async function getPatchesByDate ({ limit, offset }: { limit: number, offset: number }) {
  const viewRes = await db.view(designDocName, 'byDate', {
    limit,
    skip: offset,
    descending: true,
    include_docs: true,
  })
  return formatPatchesPage(viewRes, limit, offset)
}

export async function getPatchesByUserId ({ userId, limit, offset }: { userId: UserId, limit: number, offset: number }) {
  const [ viewRes, total ] = await Promise.all([
    db.view(designDocName, 'byUserIdAndDate', {
      startkey: [ userId, maxKey ],
      endkey: [ userId ],
      descending: true,
      limit,
      skip: offset,
      include_docs: true,
      reduce: false,
    }),
    // Unfortunately, the response doesn't gives the total range length
    // so we need to query it separately
    getUserContributionsCount(userId),
  ])

  return formatPatchesPage(viewRes, limit, offset, total)
}

export async function getPatchesByUserIdAndFilter ({ userId, filter, limit, offset }: { userId: UserId, filter: string, limit: number, offset: number }) {
  const [ viewRes, total ] = await Promise.all([
    db.view(designDocName, 'byUserIdAndFilterAndDate', {
      startkey: [ userId, filter, maxKey ],
      endkey: [ userId, filter ],
      descending: true,
      limit,
      skip: offset,
      include_docs: true,
      reduce: false,
    }),
    // Unfortunately, the response doesn't gives the total range length
    // so we need to query it separately
    getUserPropertyContributionsCount(userId, filter),
  ])

  return formatPatchesPage(viewRes, limit, offset, total)
}

export const getPatchesByRedirectUri = db.viewByKey.bind(null, 'byRedirectUri')

export async function getPatchesWithSnapshots (entityId: InvEntityId) {
  const patches = await getPatchesByEntityId(entityId)
  addVersionsSnapshots(patches)
  return patches
}

export async function getGlobalContributions () {
  let { rows } = await db.view(designDocName, 'byUserIdAndDate', { group_level: 1 })
  rows = rows.map(formatRow)
  return sortAndFilterContributions(rows)
  // Return only the first hundred results
  .slice(0, 100)
}

export function getContributionsFromLastDay (days) {
  assert_.number(days)
  const now = Date.now()
  const startTime = now - (oneDay * days)
  const today = simpleDay()
  const startDay = simpleDay(startTime)
  return db.view(designDocName, 'byDay', {
    group_level: 2,
    startkey: [ startDay ],
    endkey: [ today, maxKey ],
  })
  .then(({ rows }) => rows)
  .then(rows => convertToArray(rows.reduce(aggregatePeriodContributions, {})))
  .then(contributions => ({
    contributions,
    start: startDay,
    end: today,
  }))
}

export async function getPatchesByClaimValue (claimValue, offset, limit) {
  const { rows } = await db.view(designDocName, 'byClaimValueAndDate', {
    startkey: [ claimValue, maxKey ],
    endkey: [ claimValue ],
    descending: true,
    reduce: false,
    skip: offset,
    limit,
  })
  return rows
}

export async function getPatchesCountByClaimValue (claimValue) {
  const { rows } = await db.view(designDocName, 'byClaimValueAndDate', {
    startkey: [ claimValue, maxKey ],
    endkey: [ claimValue ],
    group_level: 1,
    descending: true,
  })
  return rows[0]?.value || 0
}

const formatRow = row => ({
  user: row.key[0],
  contributions: row.value,
})

function aggregatePeriodContributions (counts, row) {
  const userId = row.key[1]
  const contributions = row.value
  if (counts[userId] == null) { counts[userId] = 0 }
  counts[userId] += contributions
  return counts
}

function convertToArray (counts) {
  const data = []
  for (const userId in counts) {
    const contributions = counts[userId]
    data.push({ user: userId, contributions })
  }
  return sortAndFilterContributions(data)
}

function sortAndFilterContributions (rows) {
  return rows
  .filter(noSpecialUser)
  .sort((a, b) => b.contributions - a.contributions)
}

// Filtering-out special users automated contributions
// see server/db/couchdb/hard_coded_documents.js
const noSpecialUser = row => !row.user.startsWith('000000000000000000000000000000')

function getUserContributionsCount (userId) {
  return getRangeLength({
    viewName: 'byUserIdAndDate',
    startkey: [ userId ],
    endkey: [ userId, maxKey ],
  })
}

function getUserPropertyContributionsCount (userId, filter) {
  return getRangeLength({
    viewName: 'byUserIdAndFilterAndDate',
    startkey: [ userId, filter ],
    endkey: [ userId, filter, maxKey ],
  })
}

async function getRangeLength ({ viewName, startkey, endkey }) {
  const { rows } = await db.view(designDocName, viewName, {
    group_level: startkey.length,
    startkey,
    endkey,
  })
  return rows[0] != null ? rows[0].value : 0
}

interface PatchesPage {
  patches: Patch[]
  total: number
  continue?: number
}

function formatPatchesPage (viewRes, limit, offset, total?: number) {
  if (total == null) total = viewRes.total_rows
  const data: PatchesPage = {
    patches: map(viewRes.rows, 'doc'),
    total,
  }
  const rangeEnd = offset + limit
  if (rangeEnd < total) data.continue = rangeEnd
  return data
}
