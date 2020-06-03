const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const entities_ = require('./entities')
const validateEntity = require('./validate_entity')
const { prefixifyInv } = require('./prefix')

module.exports = async params => {
  const { labels, claims, userId, batchId } = params
  _.log(params, 'inv entity creation')

  await validateEntity({ labels, claims })

  const blankEntityDoc = await entities_.createBlank()

  const entity = await entities_.edit({
    userId,
    currentDoc: blankEntityDoc,
    updatedLabels: labels,
    updatedClaims: claims,
    batchId
  })
  entity.uri = prefixifyInv(entity._id)
  return entity
}
