import { cloneDeep } from 'lodash-es'
import { getEntityById, putInvEntityUpdate } from '#controllers/entities/lib/entities'
import { newError } from '#lib/error/error'
import { emit } from '#lib/radio'
import { retryOnConflict } from '#lib/retry_on_conflict'
import { assert_ } from '#lib/utils/assert_types'
import Entity from '#models/entity'
import getEntityType from './get_entity_type.js'
import inferredClaimUpdates from './inferred_claim_updates.js'
import validateAndFormatClaim from './validate_and_format_claim.js'
import validateClaimProperty from './validate_claim_property.js'

const updateInvClaim = async (user, id, property, oldVal, newVal) => {
  assert_.object(user)
  const { _id: userId, admin: userIsAdmin } = user
  let currentDoc
  try {
    currentDoc = await getEntityById(id)
  } catch (err) {
    if (err.statusCode === 404) {
      throw newError('entity not found', 400, { id, property, oldVal, newVal })
    } else {
      throw err
    }
  }
  // Known cases: entities turned into redirections or removed:placeholders
  if (currentDoc.claims == null) {
    const context = { id, property, oldVal, newVal }
    throw newError('this entity is obsolete', 400, context)
  }
  const type = getEntityType(currentDoc.claims['wdt:P31'])
  validateClaimProperty(type, property)
  const updatedDoc = await updateClaim({ type, property, oldVal, newVal, userId, currentDoc, userIsAdmin })

  await inferredClaimUpdates(updatedDoc, property, oldVal)

  await emit('entity:update:claim', updatedDoc)

  if (property === 'invp:P2' && oldVal != null) {
    await emit('image:needs:check', { container: 'entities', hash: oldVal, context: 'update' })
  }
}

const updateClaim = async params => {
  const { property, oldVal, userId, currentDoc } = params
  params.letEmptyValuePass = true
  const formattedNewVal = await validateAndFormatClaim(params)
  const updatedDoc = Entity.updateClaim(cloneDeep(currentDoc), property, oldVal, formattedNewVal)
  return putInvEntityUpdate({ userId, currentDoc, updatedDoc })
}

export default retryOnConflict({ updateFn: updateInvClaim })
