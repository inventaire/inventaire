import { cloneDeep } from 'lodash-es'
import { getEntityById, putInvEntityUpdate } from '#controllers/entities/lib/entities'
import { getEntityByUri } from '#controllers/entities/lib/get_entity_by_uri'
import { getInvEntityType } from '#controllers/entities/lib/get_entity_type'
import { getFirstClaimValue } from '#controllers/entities/lib/inv_claims_utils'
import { userHasAdminRole } from '#controllers/user/lib/user'
import { newError } from '#lib/error/error'
import { emit } from '#lib/radio'
import { retryOnConflict } from '#lib/retry_on_conflict'
import { assert_ } from '#lib/utils/assert_types'
import { isLocalEntityLayer, updateEntityDocClaim } from '#models/entity'
import type { ExtendedEntityType, InvClaimValue, InvEntity, InvEntityDoc, InvEntityId, PropertyUri } from '#server/types/entity'
import type { User, UserId } from '#server/types/user'
import inferredClaimUpdates from './inferred_claim_updates.js'
import { validateAndFormatClaim } from './validate_and_format_claim.js'
import { validateClaimProperty } from './validate_claim_property.js'

async function _updateInvClaim (user: User, id: InvEntityId, property: PropertyUri, oldVal?: InvClaimValue, newVal?: InvClaimValue) {
  assert_.object(user)
  const { _id: userId } = user
  const userIsAdmin = userHasAdminRole(user)
  let currentDoc: InvEntityDoc
  try {
    currentDoc = await getEntityById(id)
  } catch (err) {
    if (err.statusCode === 404) {
      throw newError('entity not found', 400, { id, property, oldVal, newVal })
    } else {
      throw err
    }
  }
  if ('redirect' in currentDoc || currentDoc.type === 'removed:placeholder') {
    const context = { id, property, oldVal, newVal }
    throw newError('this entity is obsolete', 400, context)
  }
  let type
  if (isLocalEntityLayer(currentDoc)) {
    const remoteUri = getFirstClaimValue(currentDoc.claims, 'invp:P1')
    const remoteEntity = await getEntityByUri({ uri: remoteUri })
    type = remoteEntity.type
  } else {
    type = getInvEntityType(currentDoc.claims['wdt:P31'])
    validateClaimProperty(type, property)
  }
  const updatedDoc = await updateClaim({ _id: id, type, property, oldVal, newVal, userId, currentDoc, userIsAdmin })

  await inferredClaimUpdates(updatedDoc, property, oldVal)

  await emit('entity:update:claim', updatedDoc)

  if (property === 'invp:P2' && oldVal != null) {
    await emit('image:needs:check', { container: 'entities', hash: oldVal, context: 'update' })
  }
}

interface UpdateClaimParams {
  _id: InvEntityId
  type: ExtendedEntityType
  property: PropertyUri
  oldVal: InvClaimValue
  newVal: InvClaimValue
  userId: UserId
  currentDoc: InvEntity
  userIsAdmin?: boolean
}

async function updateClaim (params: UpdateClaimParams) {
  const { _id, type, property, oldVal, newVal, userId, currentDoc, userIsAdmin } = params
  const formattedNewClaim = await validateAndFormatClaim({
    _id,
    type,
    property,
    oldClaim: oldVal,
    newClaim: newVal,
    userIsAdmin,
    letEmptyValuePass: true,
  })
  const updatedDoc = updateEntityDocClaim(cloneDeep(currentDoc), property, oldVal, formattedNewClaim)
  return putInvEntityUpdate({ userId, currentDoc, updatedDoc })
}

export const updateInvClaim = retryOnConflict(_updateInvClaim)
