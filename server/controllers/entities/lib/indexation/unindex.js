const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const bulk = require('./bulk')
const buildLine = bulk.buildLine.bind(null, 'delete')
const getIdsByTypes = require('./get_ids_by_types')

module.exports = async (index, type = '_all', uris) => {
  if (uris.length === 0) return

  _.info([ index, type, uris ], 'unindexed')

  return getBatch(index, type, uris.map(unprefixify))
  .then(batch => {
    if (batch.length === 0) { return }
    return bulk.postBatch(batch)
    .then(bulk.logRes(`bulk unindex res (${index}/${type})`))
  })
  .catch(_.ErrorRethrow('unindex err'))
}

// If it has a URI prefix (like 'wd' or 'inv'), remove it
// as entities are indexed with there sole id, the domain being represented
// by the index
const unprefixify = uri => uri.replace(/^(inv:|wd:)/, '')

const getBatch = async (index, type, ids) => {
  if (type != null && type !== '_all') {
    return getTypeBatchLines(index, type, ids)
  }

  return getIdsByTypes(index, ids)
  .then(idsByTypes => {
    _.info(idsByTypes, 'idsByTypes')
    return Object.keys(idsByTypes)
    .reduce(aggregateBatch(index, idsByTypes), [])
  })
}

const aggregateBatch = (index, idsByTypes) => (batch, type) => {
  const ids = idsByTypes[type]
  batch = batch.concat(getTypeBatchLines(index, type, ids))
  return batch
}

const getTypeBatchLines = (index, type, ids) => ids.map(buildLine.bind(null, index, type))
