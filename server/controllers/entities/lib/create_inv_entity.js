import _ from 'builders/utils'
import Entity from 'models/entity'
import entities_ from './entities'
import validateEntity from './validate_entity'
import { prefixifyInv } from './prefix'

export default async params => {
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
