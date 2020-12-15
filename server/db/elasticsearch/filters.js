const isntDesignDoc = doc => !doc._id.startsWith('_design/')
const { identity } = require('lodash')

module.exports = {
  entities: isntDesignDoc,
  groups: doc => doc.type === 'group',
  items: isntDesignDoc,
  // Do not filter-out doc.type=deletedUser so that deleted users can be unindexed
  users: doc => doc.type === 'user' || doc.type === 'deletedUser',
  // Do not filter-out doc.searchable=false so that toggling this settings does
  // update the document in Elasticsearch and can then be filtered-out at search time
  wikidata: identity,
}
