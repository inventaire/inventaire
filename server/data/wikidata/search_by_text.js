const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')

const searchWikidataEntities = __.require('data', 'wikidata/search_entities')
const { prefixifyWd } = __.require('controllers', 'entities/lib/prefix')
const getEntitiesByUris = __.require('controllers', 'entities/lib/get_entities_by_uris')

// TODO: recover timeout once the transition to node-fetch is done
// const { searchTimeout } = CONFIG

module.exports = async query => {
  const { search, refresh } = query
  const ids = await searchWikidataEntities({ search, refresh })
  const uris = ids.map(prefixifyWd)
  const res = await getEntitiesByUris({ uris, refresh })
  filterOutIrrelevantTypes(res.entities)
  return res
}

const filterOutIrrelevantTypes = entities => {
  Object.keys(entities).forEach(uri => {
    const entity = entities[uri]
    const { type } = entity
    const notTypeFound = (type == null)
    if (notTypeFound) _.warn(`not relevant type found, filtered out: ${uri}`)
    // /!\ At this point, entities given the type meta will look something like
    // { id: 'Q9232060', uri: 'wd:Q9232060', type: 'meta' }
    // Thus, you can't assume that entity.labels? or entity.claims? is true
    if (notTypeFound || type === 'meta') delete entities[uri]
  })
}
