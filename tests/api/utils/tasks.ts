import { values } from 'lodash-es'
import { forceArray } from '#lib/utils/base'
import { publicReq, adminReq } from './utils.js'

export const endpoint = '/api/tasks?action='

export async function getByIds (ids) {
  ids = forceArray(ids).join('|')
  const { tasks } = await publicReq('get', `${endpoint}by-ids&ids=${ids}`)
  return tasks
}

export async function getBySuspectUris (uris, type = 'deduplicate') {
  uris = forceArray(uris).join('|')
  const { tasks } = await publicReq('get', `${endpoint}by-uris&uris=${uris}&type=${type}`)
  return tasks
}

export async function getBySuspectUri (uri) {
  const obj = await getBySuspectUris(uri)
  return obj[uri]
}

export async function getBySuggestionUris (uris, type = 'deduplicate') {
  uris = forceArray(uris).join('|')
  const { tasks } = await publicReq('get', `${endpoint}by-suggestion-uris&uris=${uris}&type=${type}`)
  return tasks
}

export async function getByScore (options = {}) {
  let url = `${endpoint}by-score`
  const { limit, offset } = options
  if (limit != null) url += `&limit=${limit}`
  if (offset != null) url += `&offset=${offset}`
  const { tasks } = await publicReq('get', url)
  return tasks
}

export async function getByEntitiesType (options = {}) {
  const { type, entitiesType, limit, offset } = options
  let url = `${endpoint}by-entities-type&type=${type}&entities-type=${entitiesType}`
  if (limit != null) url += `&limit=${limit}`
  if (offset != null) url += `&offset=${offset}`
  const { tasks } = await publicReq('get', url)
  return tasks
}

export function update (id, attribute, value) {
  return adminReq('put', `${endpoint}update`, { id, attribute, value })
}

export async function checkEntities (uris) {
  uris = forceArray(uris)
  await adminReq('post', `${endpoint}check-human-duplicates`, { uris })
  const getTasksBySuspectUris = await getBySuspectUris(uris)
  return values(getTasksBySuspectUris).flat()
}
