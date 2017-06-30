CONFIG = require 'config'
__ = CONFIG.universalPath
getEntityType = __.require 'controllers', 'entities/lib/get_entity_type'

module.exports = (types)-> (res)->
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
