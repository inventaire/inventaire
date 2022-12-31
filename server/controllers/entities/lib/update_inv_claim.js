import _ from 'builders/utils'
import error_ from 'lib/error/error'
import assert_ from 'lib/utils/assert_types'
import entities_ from './entities'
import radio from 'lib/radio'
import retryOnConflict from 'lib/retry_on_conflict'
import Entity from 'models/entity'
import getEntityType from './get_entity_type'
import validateAndFormatClaim from './validate_and_format_claim'
import validateClaimProperty from './validate_claim_property'
import inferredClaimUpdates from './inferred_claim_updates'

const updateInvClaim = async (user, id, property, oldVal, newVal) => {
  assert_.object(user)
  const { _id: userId, admin: userIsAdmin } = user
  let currentDoc
  try {
    currentDoc = await entities_.byId(id)
  } catch (err) {
    if (err.statusCode === 404) {
      throw error_.new('entity not found', 400, { id, property, oldVal, newVal })
    } else {
      throw err
    }
  }
  // Known cases: entities turned into redirections or removed:placeholders
  if (currentDoc.claims == null) {
    const context = { id, property, oldVal, newVal }
    throw error_.new('this entity is obsolete', 400, context)
  }
  const type = getEntityType(currentDoc.claims['wdt:P31'])
  validateClaimProperty(type, property)
  const updatedDoc = await updateClaim({ type, property, oldVal, newVal, userId, currentDoc, userIsAdmin })

  await inferredClaimUpdates(updatedDoc, property, oldVal)

  await radio.emit('entity:update:claim', updatedDoc)

  if (property === 'invp:P2' && oldVal != null) {
    await radio.emit('image:needs:check', { container: 'entities', hash: oldVal, context: 'update' })
  }
}

const updateClaim = async params => {
  const { property, oldVal, userId, currentDoc } = params
  params.letEmptyValuePass = true
  const formattedNewVal = await validateAndFormatClaim(params)
  const updatedDoc = Entity.updateClaim(_.cloneDeep(currentDoc), property, oldVal, formattedNewVal)
  return entities_.putUpdate({ userId, currentDoc, updatedDoc })
}

export default retryOnConflict({ updateFn: updateInvClaim })
