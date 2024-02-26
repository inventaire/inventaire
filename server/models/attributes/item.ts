const attributes = {}

export default attributes

attributes.updatable = [
  'transaction',
  'pictures',
  'visibility',
  'details',
  'notes',
  'shelves',
  // Use case: change from a work entity to an edition entity
  'entity',
]

attributes.validAtCreation = [
  'entity',
  'transaction',
  'pictures',
  'visibility',
  'details',
  'notes',
  'shelves',
]

// Not updatable by the user
attributes.notUpdatable = [
  '_id',
  '_rev',
  'created',

  // Updated when user updatable attributes are updated
  'updated',

  // Updated as side effects of transactions
  'owner',
  'history',

  // Updated as side effects of entity redirections
  'previousEntity',

]

attributes.known = attributes.notUpdatable.concat(attributes.updatable)

attributes.private = [
  'notes',
  'visibility',
]

// Attribute to reset on owner change
attributes.reset = attributes.private.concat([
  'details',
])

const allowTransaction = [ 'giving', 'lending', 'selling' ]
const doesntAllowTransaction = [ 'inventorying' ]

attributes.allowTransaction = allowTransaction
attributes.doesntAllowTransaction = doesntAllowTransaction

attributes.constrained = {
  transaction: {
    possibilities: allowTransaction.concat(doesntAllowTransaction),
    defaultValue: 'inventorying',
  },
}

// Attributes to keep in documents where a stakeholder might loose
// access to those data
// ex: in a transaction, when the item isn't visible to the previous owner anymore
// Attributes such as _id and transaction are already recorded by a transaction
// thus their absence here as long as only transactions doc uses snaphshot
attributes.snapshot = [
  'entity',
  'details',
]

attributes.notIndexed = [
  'previousEntity',
  'notes',
]
