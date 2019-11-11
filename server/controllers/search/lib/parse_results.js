// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const getEntityType = __.require('controllers', 'entities/lib/get_entity_type')

module.exports = types => (function(res) {
  if ((res.hits != null ? res.hits.hits : undefined) == null) return []

  return res.hits.hits
  .map(fixEntityType)
  .filter(isOfDesiredTypes(types))
})

var fixEntityType = function(result){
  result._db_type = result._type
  // Pluralized types to be aligned with Wikidata Subset Search Engine indexes results
  if (result._type === 'user') { result._type = 'users'
  } else if (result._type === 'group') { result._type = 'groups'
  // inv entities are all put in the same index with the same type by couch2elastic4sync
  // thus the need to recover it
  } else if (result._type === 'entity') {
    // Type is pluralzed, thus the +'s'
    result._type = getEntityType(result._source.claims['wdt:P31']) + 's'
  }

  return result
}

// Required for local entities that are all indexed with the type 'entity'
// including editions
var isOfDesiredTypes = types => (function(result) {
  if (result._db_type === 'entity') { return types.includes(result._type)
  } else { return true }
})
