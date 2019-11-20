const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')

const searchWikidataEntities = __.require('data', 'wikidata/search_entities')
const { prefixifyWd } = __.require('controllers', 'entities/lib/prefix')
const getEntitiesByUris = __.require('controllers', 'entities/lib/get_entities_by_uris')

const { searchTimeout } = CONFIG

module.exports = query => {
  const { search, refresh } = query
  return searchWikidataEntities({ search, refresh })
  .timeout(searchTimeout)
  .map(prefixifyWd)
  .then(uris => getEntitiesByUris({ uris, refresh }))
  .then(filterOutIrrelevantTypes)
  .catch(error_.notFound)
}

const filterOutIrrelevantTypes = result => {
  for (const uri in result.entities) {
    const entity = result.entities[uri]
    const { type } = entity
    const notTypeFound = (type == null)
    if (notTypeFound) { _.warn(`not relevant type found, filtered out: ${uri}`) }
    // /!\ At this point, entities given the type meta will look something like
    // { id: 'Q9232060', uri: 'wd:Q9232060', type: 'meta' }
    // Thus, you can't assume that entity.labels? or entity.claims? is true
    if (notTypeFound || (type === 'meta')) { delete result.entities[uri] }
  }

  return result
}
