import { getEntitiesByUris } from './get_entities_by_uris.js'

// Get only the entity formatted doc you needs instead of an object
// with entities and redirects
export const getEntityByUri = ({ uri, refresh, dry }) => {
  const uris = [ uri ]
  return getEntitiesByUris({ uris, refresh, dry })
  .then(res => Object.values(res.entities)[0])
}
