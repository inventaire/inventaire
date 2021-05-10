const _ = require('builders/utils')
const getEntitiesByUris = require('./get_entities_by_uris')

// Get only the entity formatted doc you needs instead of an object
// with entities and redirects
module.exports = ({ uri, refresh, dry }) => {
  const uris = [ uri ]
  return getEntitiesByUris({ uris, refresh, dry })
  .then(res => _.values(res.entities)[0])
}
