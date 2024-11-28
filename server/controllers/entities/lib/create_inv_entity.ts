import { cloneDeep } from 'lodash-es'
import { putInvEntityUpdate, type PutInvEntityCreationParams } from '#controllers/entities/lib/entities'
import type { AccessLevel } from '#lib/user_access_levels'
import { log, success } from '#lib/utils/logs'
import { addEntityDocClaims, createBlankEntityDoc, setEntityDocLabels } from '#models/entity'
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
  userAccessLevels?: AccessLevel[]
}

export async function createInvEntity (params: CreateInvEntityParams) {
  const { labels = {}, claims, userId, batchId, userAccessLevels } = params
  log(params, 'inv entity creation')

  await validateInvEntity({ labels, claims }, userAccessLevels)

  const currentDoc = createBlankEntityDoc()
  let updatedDoc = cloneDeep(currentDoc)
  updatedDoc = setEntityDocLabels(updatedDoc, labels)
  updatedDoc = addEntityDocClaims(updatedDoc, claims)
  const updateParams = { userId, currentDoc, updatedDoc, batchId, create: true } as PutInvEntityCreationParams
  const createdEntity = await putInvEntityUpdate(updateParams)
  // @ts-expect-error
  createdEntity.uri = prefixifyInv(createdEntity._id)
  // @ts-expect-error
  success(`inv entity created: ${createdEntity.uri}`)
  return createdEntity
}
