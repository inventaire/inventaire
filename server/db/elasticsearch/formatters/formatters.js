const { remoteEntities } = require('config')

const formatters = module.exports = {
  groups: require('./group'),
  items: require('./item'),
  users: require('./user'),
}

if (remoteEntities == null) {
  Object.assign(formatters, {
    entities: require('./entity'),
    wikidata: require('./entity'),
  })
}

module.exports = formatters
