const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const bulk = require('./bulk')
const buildLine = bulk.buildLine.bind(null, 'index')
const { wikidata: wdIndex, entities: invIndex } = __.require('controllers', 'search/lib/indexes').indexes
const { getEntityDomain } = require('./helpers')

const indexPerDomain = {
  wd: wdIndex,
  inv: invIndex
}

module.exports = async (type, entities) => {
  if (entities.length === 0) return

  const batch = []
  entities.forEach(appendEntity(type, batch))

  return bulk.postBatch(batch)
  .then(bulk.logRes('bulk post res'))
  .catch(_.Error('bulk post err'))
}

// see: https://www.elastic.co/guide/en/elasticsearch/guide/current/bulk.html
const appendEntity = (type, batch) => entity => {
  const domain = getEntityDomain(entity)
  // Guessing the index that late allows to not assume the index from the source
  // as Wikidata entities might be coming from the Inventaire API
  // Known case: Inventaire entities redirecting to Wikidata entities
  const index = indexPerDomain[domain]
  batch.push(buildLine(index, type, entity.id))
  batch.push(JSON.stringify(entity))
}
