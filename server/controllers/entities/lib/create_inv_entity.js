
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const entities_ = require('./entities')
const validateEntity = require('./validate_entity')
const { prefixifyInv } = require('./prefix')

module.exports = params => {
  const { labels, claims, userId, batchId } = params
  _.log(params, 'inv entity creation')

  return validateEntity({ labels, claims })
  .then(() => entities_.createBlank())
  .then(currentDoc => entities_.edit({
    userId,
    currentDoc,
    updatedLabels: labels,
    updatedClaims: claims,
    batchId
  }))
  .then(entity => {
    entity.uri = prefixifyInv(entity._id)
    return entity
  })
}
