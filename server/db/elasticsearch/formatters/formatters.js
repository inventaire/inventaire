const { identity } = require('lodash')

module.exports = {
  entities: require('./entity'),
  groups: identity,
  items: require('./item'),
  users: require('./user'),
  wikidata: require('./entity'),
}
