const follow = require('lib/follow')
const filters = require('./filters')
const indexation = require('./indexation')

module.exports = indexBaseName => {
  follow({
    dbBaseName: indexBaseName,
    filter: filters[indexBaseName],
    onChange: reindex(indexBaseName)
  })
}

const reindex = indexBaseName => {
  const indexFn = indexation(indexBaseName)
  return ({ doc }) => indexFn(doc)
}
