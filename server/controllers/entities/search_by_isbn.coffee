CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

module.exports = (query)->
  isbn = query.search

  promise = getEntitiesByIsbns query.isbn
  .then _.Log('getEntitiesByIsbns resp')
  .then (resp)->
    { entities, seeds } = resp
    entities = _.values entities
    if entities.length is 1
      results = entities
      # Wikidata isn't queried for ISBNs at the moment
      # as ISBNs are inconsistently set on works or editions
      # So it can only be an 'inv' entity
      source = 'inv'
    else
      results = _.values seeds
      source = 'dataseed'

    return { source, results, search: isbn }

  # ./search_entity expects an array of promises
  return [ promise ]
