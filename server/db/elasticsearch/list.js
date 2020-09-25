const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')

// Using CouchDB database names + environment suffix as indexes names
const indexesData = [
  { indexBaseName: 'users', sync: true },
  { indexBaseName: 'groups', sync: true },
  { indexBaseName: 'items', sync: true },
  { indexBaseName: 'entities', sync: true },
  { indexBaseName: 'wikidata', index: 'wikidata', sync: false }
  // No 'entities' entry as it is fully handled by the entities search engine
  // See server/controllers/entities/lib/update_search_engine.js
]
.map(data => {
  data.index = data.index || CONFIG.db.name(data.indexBaseName)
  return data
})

const indexes = _.keyBy(indexesData, 'indexBaseName')

const indexesList = _.map(indexesData, 'index')

const mappingsList = {
  items: require('./mappings/items'),
  // wikidata: require('./mappings/wikidata')
  entities: require('./mappings/wikidata')
}

const syncIndexesList = indexesData
  .filter(indexData => indexData.sync)
  .map(_.property('indexBaseName'))

module.exports = { indexes, indexesList, mappingsList, syncIndexesList }
