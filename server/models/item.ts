import { clone, omit } from 'lodash-es'
import { newError } from '#lib/error/error'
import { assertTypes, assertObjects, assertObject, assertString } from '#lib/utils/assert_types'
import { arrayIncludes } from '#lib/utils/base'
import { log } from '#lib/utils/logs'
import { objectKeys } from '#lib/utils/types'
import type { Item } from '#types/item'
import type { UserId } from '#types/user'
import itemAttributes, { type UpdatableItemAttributes } from './attributes/item.js'
import itemValidations from './validations/item.js'

const { defaultValue: defaultTransaction } = itemAttributes.constrained.transaction

export function createItemDoc (userId, item) {
  assertTypes([ 'string', 'object' ], [ userId, item ])
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

type NewAttributes = Partial<Pick<Item, UpdatableItemAttributes>>

export function updateItemDoc (userId: UserId, newAttributes: NewAttributes, oldItem: Item) {
  assertString(userId)
  assertObject(newAttributes)
  assertObject(oldItem)

  if (oldItem.owner !== userId) {
    throw newError('user is not item owner', 400, { userId, ownerId: oldItem.owner })
  }

  const newItem = clone(oldItem)

  newAttributes = omit(newAttributes, itemAttributes.notUpdatable)

  const passedAttributes = objectKeys(newAttributes)

  for (const attr of passedAttributes) {
    if (!arrayIncludes(itemAttributes.updatable, attr)) {
      throw newError(`invalid attribute: ${attr}`, 400, { userId, newAttributes, oldItem })
    }
    const newVal = newAttributes[attr]
    itemValidations.pass(attr, newVal)
    // @ts-expect-error TS2322 "Type 'string' is not assignable to type 'never'" ?!?
    newItem[attr] = newVal
  }

  const now = Date.now()
  newItem.updated = now
  return newItem
}

export function changeItemDocOwner (transacDoc, item) {
  assertObjects([ transacDoc, item ])
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
