const CONFIG = require('config')
const __ = CONFIG.universalPath
// const error_ = __.require('lib', 'error/error')
const follow = __.require('lib', 'follow')
const indexation = require('./indexation')
const filters = require('./filters')

module.exports = indexBaseName => {
  const index = CONFIG.db.name(indexBaseName)
  follow({
    dbBaseName: indexBaseName,
    filter: filters[indexBaseName],
    onChange: reindex(indexBaseName, index)
  })
}

const reindex = (indexBaseName, index) => {
  const indexFn = indexation(indexBaseName, index)
  return ({ doc }) => indexFn(doc)
}
