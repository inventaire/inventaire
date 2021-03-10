const CONFIG = require('config')
const follow = require('lib/follow')
const filters = require('./filters')
const indexation = require('./indexation')

module.exports = indexBaseName => {
  const index = CONFIG.db.name(indexBaseName)
  follow({
    dbBaseName: indexBaseName,
    filter: filters[indexBaseName],
    onChange: reindex(indexBaseName, index)
  })
}

const reindex = (indexBaseName, index) => {
  const indexFn = indexation({ indexBaseName, index })
  return ({ doc }) => indexFn(doc)
}
