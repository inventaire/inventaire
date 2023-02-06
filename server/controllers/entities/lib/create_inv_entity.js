import { editEntity } from '#controllers/entities/lib/entities'
import { log } from '#lib/utils/logs'
import Entity from '#models/entity'
import { prefixifyInv } from './prefix.js'
import validateEntity from './validate_entity.js'

export default async params => {
  const { labels, claims, userId, batchId } = params
  log(params, 'inv entity creation')

  await validateEntity({ labels, claims })

  const blankEntityDoc = Entity.create()

  const entity = await editEntity({
    create: true,
    userId,
    currentDoc: blankEntityDoc,
    updatedLabels: labels,
    updatedClaims: claims,
    batchId,
  })
  entity.uri = prefixifyInv(entity._id)
  return entity
}
