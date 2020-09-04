const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { typesData } = require('./indexes')

module.exports = typesList => {
  const data = { indexes: [], types: [] }
  const { indexes, types } = typesList.reduce(aggregateIndexesAndTypes, data)
  return { indexes: _.uniq(indexes), types }
}

const aggregateIndexesAndTypes = (data, nextType) => {
  const { indexes, type } = typesData[nextType]
  data.indexes = data.indexes.concat(indexes)
  data.types.push(type)
  return data
}
