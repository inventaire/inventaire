import { clone, omit } from 'lodash-es'
import { error_ } from '#lib/error/error'
import { assert_ } from '#lib/utils/assert_types'
import { log } from '#lib/utils/logs'
import itemAttributes from './attributes/item.js'
import itemValidations from './validations/item.js'

const Item = {}

export default Item

const validations = Item.validations = itemValidations
const attributes = Item.attributes = itemAttributes

const { defaultValue: defaultTransaction } = attributes.constrained.transaction

Item.create = (userId, item) => {
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
    if (!attributes.validAtCreation.includes(attr)) {
      throw error_.new(`invalid attribute: ${attr}`, 400, { userId, item })
    }

    validations.pass(attr, item[attr])
  }

  validations.pass('userId', userId)

  item.owner = userId
  item.created = Date.now()
  return item
}

Item.update = (userId, newAttributes, oldItem) => {
  assert_.string(userId)
  assert_.object(newAttributes)
  assert_.object(oldItem)

  if (oldItem.owner !== userId) {
    throw error_.new('user is not item owner', 400, { userId, ownerId: oldItem.owner })
  }

  const newItem = clone(oldItem)

  newAttributes = omit(newAttributes, attributes.notUpdatable)

  const passedAttributes = Object.keys(newAttributes)

  for (const attr of passedAttributes) {
    if (!attributes.updatable.includes(attr)) {
      throw error_.new(`invalid attribute: ${attr}`, 400, { userId, newAttributes, oldItem })
    }
    const newVal = newAttributes[attr]
    validations.pass(attr, newVal)
    newItem[attr] = newVal
  }

  const now = Date.now()
  newItem.updated = now
  return newItem
}

Item.changeOwner = (transacDoc, item) => {
  assert_.objects([ transacDoc, item ])
  log({ transacDoc, item }, 'changeOwner')

  item = omit(item, attributes.reset)
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

Item.allowTransaction = item => attributes.allowTransaction.includes(item.transaction)

Item.updateEntity = (fromUri, toUri, item) => {
  if (item.entity !== fromUri) {
    throw error_.new(`wrong entity uri: expected ${fromUri}, got ${item.entity}`, 500)
  }

  item.entity = toUri
  // Keeping track of previous entity URI in case a rollback is needed
  if (!item.previousEntity) { item.previousEntity = [] }
  item.previousEntity.unshift(fromUri)

  return item
}

Item.revertEntity = (fromUri, toUri, item) => {
  const { entity } = item
  const previousEntity = item.previousEntity[0]
  if (item.entity !== toUri) {
    throw error_.new(`wrong entity uri: expected ${entity}, got ${toUri}`, 500)
  }

  if (fromUri !== previousEntity) {
    const message = `wrong previous entity: expected ${previousEntity}, got ${fromUri}`
    throw error_.new(message, 500)
  }

  item.entity = previousEntity
  item.previousEntity.shift()

  return item
}
