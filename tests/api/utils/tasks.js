import { forceArray } from '#lib/utils/base'
import { publicReq, adminReq } from './utils.js'

export const endpoint = '/api/tasks?action='

export const getByIds = ids => {
  ids = forceArray(ids).join('|')
  return publicReq('get', `${endpoint}by-ids&ids=${ids}`)
  .then(({ tasks }) => tasks)
}

export const getBySuspectUris = (uris, type = 'deduplicate') => {
  uris = forceArray(uris).join('|')
  return publicReq('get', `${endpoint}by-uris&uris=${uris}&type=${type}`)
  .then(({ tasks }) => tasks)
}

export const getBySuspectUri = uri => {
  return getBySuspectUris(uri)
  .then(obj => obj[uri])
}

export const getBySuggestionUris = (uris, type = 'deduplicate') => {
  uris = forceArray(uris).join('|')
  return publicReq('get', `${endpoint}by-suggestion-uris&uris=${uris}&type=${type}`)
  .then(({ tasks }) => tasks)
}

export const getByScore = (options = {}) => {
  let url = `${endpoint}by-score`
  const { limit, offset } = options
  if (limit != null) url += `&limit=${limit}`
  if (offset != null) url += `&offset=${offset}`
  return publicReq('get', url)
  .then(({ tasks }) => tasks)
}

export const getByEntitiesType = (options = {}) => {
  const { type, entitiesType, limit, offset } = options
  let url = `${endpoint}by-entities-type&type=${type}&entities-type=${entitiesType}`
  if (limit != null) url += `&limit=${limit}`
  if (offset != null) url += `&offset=${offset}`
  return publicReq('get', url)
  .then(({ tasks }) => tasks)
}

export const update = (id, attribute, value) => {
  return adminReq('put', `${endpoint}update`, { id, attribute, value })
}

export const checkEntities = uris => {
  uris = forceArray(uris)
  return adminReq('post', `${endpoint}check-human-duplicates`, { uris })
  .then(() => getBySuspectUris(uris))
  .then(getTasksBySuspectUris => Object.values(getTasksBySuspectUris).flat())
}
