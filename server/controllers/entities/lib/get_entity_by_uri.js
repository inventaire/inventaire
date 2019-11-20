
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const getEntitiesByUris = require('./get_entities_by_uris')

// Get only the entity formatted doc you needs instead of an object
// with entities and redirects
module.exports = params => {
  const { uri, refresh, dry } = params
  const uris = [ uri ]
  return getEntitiesByUris({ uris, refresh, dry })
  .then(res => _.values(res.entities)[0])
}
