CONFIG = require 'config'
__ = CONFIG.universalPath
getEntityType = __.require 'controllers', 'entities/lib/get_entity_type'
Group = __.require 'models', 'group'

module.exports = (types)-> (res)->
  unless res.hits?.hits? then return []

  res.hits.hits
  .map fixEntityType
  .filter isOfDesiredTypes(types)

fixEntityType = (result)->
  result._db_type = result._type
  # Pluralized types to be aligned with Wikidata Subset Search Engine indexes results
  if result._type is 'user' then result._type = 'users'
  else if result._type is 'group' then result._type = 'groups'
  # inv entities are all put in the same index with the same type by couch2elastic4sync
  # thus the need to recover it
  else if result._type is 'entity'
    # Type is pluralzed, thus the +'s'
    result._type = getEntityType(result._source.claims['wdt:P31']) + 's'

  return result

# Required for local entities that are all indexed with the type 'entity'
# including editions
isOfDesiredTypes = (types)-> (result)->
  if result._db_type is 'entity' then return result._type in types
  else return true
