const { remoteEntities } = require('config')
const requests_ = require('lib/requests')
const { buildPath, forceArray } = require('lib/utils/base')

const getEntitiesByUris = async ({ uris }) => {
  uris = forceArray(uris)
  if (uris.length === 0) return []
  const path = buildPath('/api/entities', { action: 'by-uris', uris: uris.join('|') })
  const { entities } = await requests_.get(`${remoteEntities}${path}`)
  return entities
}

const getEntityByUri = async ({ uri }) => {
  const [ entity ] = await getEntitiesList(uri)
  return entity
}

const getEntitiesList = async uris => {
  const entities = await getEntitiesByUris({ uris })
  return Object.values(entities)
}

const getUrisByClaim = async (property, value) => {
  const path = buildPath('/api/entities', { action: 'reverse-claims', property, value })
  const { uris } = await requests_.get(`${remoteEntities}${path}`)
  return uris
}

module.exports = {
  getEntitiesByUris,
  getEntityByUri,
  getEntitiesList,
  getUrisByClaim,
}
