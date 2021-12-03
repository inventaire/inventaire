const _ = require('builders/utils')
const Entity = require('models/entity')
const entities_ = require('./entities')
const validateEntity = require('./validate_entity')
const { prefixifyInv } = require('./prefix')

module.exports = async params => {
  const { labels, claims, userId, batchId } = params
  _.log(params, 'inv entity creation')

  await validateEntity({ labels, claims })

  const blankEntityDoc = Entity.create()

  const entity = await entities_.edit({
    create: true,
    userId,
    currentDoc: blankEntityDoc,
    updatedLabels: labels,
    updatedClaims: claims,
    batchId
  })
  entity.uri = prefixifyInv(entity._id)
  return entity
}
