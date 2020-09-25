const CONFIG = require('config')
const __ = CONFIG.universalPath
// const error_ = __.require('lib', 'error/error')
const follow = __.require('lib', 'follow')
const indexation = require('./indexation')
const isntDesignDoc = doc => !doc._id.startsWith('_design/')

const filters = {
  // Do not filter-out doc.type=deletedUser so that deleted users can be unindexed
  users: doc => doc.type === 'user' || doc.type === 'deletedUser',
  // Do not filter-out doc.searchable=false so that toggling this settings does
  // update the document in Elasticsearch and can then be filtered-out at search time
  groups: doc => doc.type === 'group',
  items: isntDesignDoc,
  entities: isntDesignDoc,
}

module.exports = indexBaseName => {
  const index = CONFIG.db.name(indexBaseName)
  follow({
    dbBaseName: indexBaseName,
    filter: filters[indexBaseName],
    onChange: reindex(indexBaseName, index)
  })
}

const reindex = (indexBaseName, index) => ({ doc }) => {
  indexation(indexBaseName, index, doc)
}
