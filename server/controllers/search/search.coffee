CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
{ host:elasticHost } = CONFIG.elasticsearch
{ parseResponse, formatError } = __.require 'lib', 'elasticsearch'
getEntityType = __.require 'controllers', 'entities/lib/get_entity_type'

entitiesDbName = CONFIG.db.name 'entities'
typesData =
  works: { indexes: [ 'wikidata', entitiesDbName], types: ['works', 'entity'] }
  humans: { indexes: [ 'wikidata', entitiesDbName], types: ['humans', 'entity'] }
  series: { indexes: [ 'wikidata', entitiesDbName], types: ['series', 'entity'] }
  users: { indexes: [ CONFIG.db.name('users')], types: ['user'] }
  groups: { indexes: [ CONFIG.db.name('groups')], types: ['group'] }

possibleTypes =  Object.keys typesData

module.exports =
  get: (req, res)->
    { types, search } = req.query

    _.info [ types, search ], 'entities local search'

    unless _.isNonEmptyString search
      return error_.bundleMissingQuery req, res, 'search'

    unless _.isNonEmptyString types
      return error_.bundleMissingQuery req, res, 'types'

    typesList = types.split '|'
    for type in typesList
      if type not in possibleTypes
        return error_.bundleInvalid req, res, 'type', type

    { indexes, types } = getIndexesAndTypes typesList

    url = "#{elasticHost}/#{indexes.join(',')}/#{types.join(',')}/_search"

    _.log url, 'global search'

    body = queryBodyBuilder search

    promises_.post { url, body }
    .catch formatError
    .then parseResults(types)
    .then _.Wrap(res, 'results')
    .catch error_.Handler(req, res)

getIndexesAndTypes = (typesList)->
  data = { indexes: [], types: [] }
  { indexes, types } = typesList.reduce aggregateIndexesAndTypes, data
  return { indexes: _.uniq(indexes), types: _.uniq(types) }

aggregateIndexesAndTypes = (data, type)->
  { indexes, types } = typesData[type]
  data.indexes = data.indexes.concat indexes
  data.types = data.types.concat types
  return data

queryBodyBuilder = (search)->
  should = [
    { match: { _all: { query: search, boost: 5 } } }
    { prefix: { _all: _.last(search.split(' ')) } }
  ]

  return { query: { bool: { should } } }

parseResults = (types)-> (res)->
  unless res.hits?.hits? then return []

  res.hits.hits
  .map fixEntityType
  .filter isOfDesiredTypes(types)

fixEntityType = (hit)->
  hit._db_type = hit._type
  # Pluralized types to be aligned with Wikidata Subset Search Engine indexes results
  if hit._type is 'user' then hit._type = 'users'
  else if hit._type is 'group' then hit._type = 'groups'
  # inv entities are all put in the same index with the same type by couch2elastic4sync
  # thus the need to recover it
  else if hit._type is 'entity'
    # Type is pluralzed, thus the +'s'
    hit._type = getEntityType(hit._source.claims['wdt:P31']) + 's'

  return hit

# Required for local entities that are all indexed with the type 'entity'
# including editions
isOfDesiredTypes = (types)-> (hit)->
  if hit._db_type is 'entity' then return hit._type in types
  else return true
