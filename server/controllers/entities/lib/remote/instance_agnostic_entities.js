const { remoteEntities } = require('config')

if (remoteEntities) {
  module.exports = require('./get_remote_entities_by_uris')
} else {
  module.exports = {
    getEntitiesByUris: require('../get_entities_by_uris'),
    getEntityByUri: require('../get_entity_by_uri'),
    getEntitiesList: require('../get_entities_list'),
    getUrisByClaim: require('../entities').urisByClaim,
  }
}
