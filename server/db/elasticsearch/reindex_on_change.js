const CONFIG = require('config')
const __ = CONFIG.universalPath
// const error_ = __.require('lib', 'error/error')
const follow = __.require('lib', 'follow')
const indexation = require('./indexation')
const isntDesignDoc = doc => !doc._id.startsWith('_design/')
const filters = {
  users: doc => doc.type === 'user',
  groups: isntDesignDoc,
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
