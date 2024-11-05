import { editInvEntity } from '#controllers/entities/lib/entities'
import { log, success } from '#lib/utils/logs'
import { createBlankEntityDoc } from '#models/entity'
import type { InvEntity } from '#server/types/entity'
import type { BatchId } from '#server/types/patch'
import type { UserId } from '#server/types/user'
import { prefixifyInv } from './prefix.js'
import { validateInvEntity } from './validate_entity.js'

interface CreateInvEntityParams {
  labels?: InvEntity['labels']
  claims: InvEntity['claims']
  userId: UserId
  batchId?: BatchId
}

export async function createInvEntity (params: CreateInvEntityParams) {
  const { labels = {}, claims, userId, batchId } = params
  log(params, 'inv entity creation')

  await validateInvEntity({ labels, claims })

  const blankEntityDoc = createBlankEntityDoc()

  const entity = await editInvEntity({
    create: true,
    userId,
    currentDoc: blankEntityDoc,
    updatedLabels: labels,
    updatedClaims: claims,
    batchId,
  })
  entity.uri = prefixifyInv(entity._id)
  success(`inv entity created: ${entity.uri}`)
  return entity
}
