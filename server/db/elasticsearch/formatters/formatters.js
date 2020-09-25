const { identity } = require('lodash')

module.exports = {
  items: require('./item'),
  groups: identity,
  users: require('./user'),
  entities: identity,
}
