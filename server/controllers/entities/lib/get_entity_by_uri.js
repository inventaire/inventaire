import getEntitiesByUris from './get_entities_by_uris'

// Get only the entity formatted doc you needs instead of an object
// with entities and redirects
export default ({ uri, refresh, dry }) => {
  const uris = [ uri ]
  return getEntitiesByUris({ uris, refresh, dry })
  .then(res => Object.values(res.entities)[0])
}
