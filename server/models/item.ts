import { clone, omit } from 'lodash-es'
import { newError } from '#lib/error/error'
import { assert_ } from '#lib/utils/assert_types'
import { log } from '#lib/utils/logs'
import itemAttributes from './attributes/item.js'
import itemValidations from './validations/item.js'

const { defaultValue: defaultTransaction } = itemAttributes.constrained.transaction

export function createItemDoc (userId, item) {
  assert_.types([ 'string', 'object' ], [ userId, item ])
  // _id: We want to get couchdb sequential id so we need to let _id blank
  // owner: ignore any passed owner, the owner is the authentified user
  // created: ignore what the client may say, it will be re-set here
  item = omit(item, [ '_id', 'owner', 'created' ])
  const passedAttributes = Object.keys(item)

  item.visibility = item.visibility || []
  item.transaction = item.transaction || defaultTransaction
  item.shelves = item.shelves || []

  for (const attr of passedAttributes) {
    if (!itemAttributes.validAtCreation.includes(attr)) {
      throw newError(`invalid attribute: ${attr}`, 400, { userId, item })
    }

    itemValidations.pass(attr, item[attr])
  }

  itemValidations.pass('userId', userId)

  item.owner = userId
  item.created = Date.now()
  return item
}

export function updateItemDoc (userId, newAttributes, oldItem) {
  assert_.string(userId)
  assert_.object(newAttributes)
  assert_.object(oldItem)

  if (oldItem.owner !== userId) {
    throw newError('user is not item owner', 400, { userId, ownerId: oldItem.owner })
  }

  const newItem = clone(oldItem)

  newAttributes = omit(newAttributes, itemAttributes.notUpdatable)

  const passedAttributes = Object.keys(newAttributes)

  for (const attr of passedAttributes) {
    if (!itemAttributes.updatable.includes(attr)) {
      throw newError(`invalid attribute: ${attr}`, 400, { userId, newAttributes, oldItem })
    }
    const newVal = newAttributes[attr]
    itemValidations.pass(attr, newVal)
    newItem[attr] = newVal
  }

  const now = Date.now()
  newItem.updated = now
  return newItem
}

export function changeItemDocOwner (transacDoc, item) {
  assert_.objects([ transacDoc, item ])
  log({ transacDoc, item }, 'changeOwner')

  item = omit(item, itemAttributes.reset)
  log(item, 'item without reset attributes')

  const { _id: transacId, owner, requester } = transacDoc

  if (item.owner !== owner) {
    throw new Error("owner doesn't match item owner")
  }

  if (!item.history) { item.history = [] }
  item.history.push({
    transaction: transacId,
    previousOwner: owner,
    timestamp: Date.now(),
  })

  log(item.history, 'updated history')

  return Object.assign(item, {
    owner: requester,
    // default values
    transaction: 'inventorying',
    visibility: [],
    shelves: [],
    updated: Date.now(),
  })
}

export function itemAllowsTransactions (item) {
  return itemAttributes.allowTransaction.includes(item.transaction)
}

export function updateItemDocEntity (fromUri, toUri, item) {
  if (item.entity !== fromUri) {
    throw newError(`wrong entity uri: expected ${fromUri}, got ${item.entity}`, 500)
  }

  item.entity = toUri
  // Keeping track of previous entity URI in case a rollback is needed
  if (!item.previousEntity) { item.previousEntity = [] }
  item.previousEntity.unshift(fromUri)

  return item
}

export function revertItemDocEntity (fromUri, toUri, item) {
  const { entity } = item
  const previousEntity = item.previousEntity[0]
  if (item.entity !== toUri) {
    throw newError(`wrong entity uri: expected ${entity}, got ${toUri}`, 500)
  }

  if (fromUri !== previousEntity) {
    const message = `wrong previous entity: expected ${previousEntity}, got ${fromUri}`
    throw newError(message, 500)
  }

  item.entity = previousEntity
  item.previousEntity.shift()

  return item
}
