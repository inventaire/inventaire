CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ typesData } = require './types'

module.exports = (typesList)->
  data = { indexes: [], types: [] }
  { indexes, types } = typesList.reduce aggregateIndexesAndTypes, data
  return { indexes: _.uniq(indexes), types }

aggregateIndexesAndTypes = (data, nextType)->
  { indexes, type } = typesData[nextType]
  data.indexes = data.indexes.concat indexes
  data.types.push type
  return data
