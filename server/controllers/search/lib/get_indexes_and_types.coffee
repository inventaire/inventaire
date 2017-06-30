CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ typesData } = require './types'

module.exports = (typesList)->
  data = { indexes: [], types: [] }
  { indexes, types } = typesList.reduce aggregateIndexesAndTypes, data
  return { indexes: _.uniq(indexes), types: _.uniq(types) }

aggregateIndexesAndTypes = (data, type)->
  { indexes, types } = typesData[type]
  data.indexes = data.indexes.concat indexes
  data.types = data.types.concat types
  return data
