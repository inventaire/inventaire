import { forceArray } from '#lib/utils/base'
import { publicReq, adminReq } from './utils.js'

const endpoint = '/api/tasks?action='

export const getByIds = ids => {
  ids = forceArray(ids).join('|')
  return publicReq('get', `${endpoint}by-ids&ids=${ids}`)
  .then(({ tasks }) => tasks)
}

export const getBySuspectUris = uris => {
  uris = forceArray(uris).join('|')
  return publicReq('get', `${endpoint}by-suspect-uris&uris=${uris}`)
  .then(({ tasks }) => tasks)
}

export const getBySuspectUri = uri => {
  return getBySuspectUris(uri)
  .then(obj => obj[uri])
}

export const getBySuggestionUris = uris => {
  uris = forceArray(uris).join('|')
  return publicReq('get', `${endpoint}by-suggestion-uris&uris=${uris}`)
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
  const { type, limit, offset } = options
  let url = `${endpoint}by-entities-type&type=${type}`
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
  return adminReq('post', `${endpoint}check-entities`, { uris })
  .then(() => getBySuspectUris(uris))
  .then(getTasksBySuspectUris => Object.values(getTasksBySuspectUris).flat())
}
