const updatable = [
  'transaction',
  'visibility',
  'details',
  'notes',
  'shelves',
  // Use case for making entity updatable: change from a work entity to an edition entity
  'entity',
] as const

export type UpdatableItemAttributes = typeof updatable[number]

const validAtCreation = [
  'entity',
  'transaction',
  'visibility',
  'details',
  'notes',
  'shelves',
]

// Not updatable by the user
const notUpdatable = [
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

const privat = [
  'notes',
  'visibility',
]

const allowTransaction = [ 'giving', 'lending', 'selling' ] as const
const doesntAllowTransaction = [ 'inventorying' ] as const

export const itemTransactionModes = [ ...allowTransaction, ...doesntAllowTransaction ] as const

// Attributes to keep in documents where a stakeholder might loose
// access to those data
// ex: in a transaction, when the item isn't visible to the previous owner anymore
// Attributes such as _id and transaction are already recorded by a transaction
// thus their absence here as long as only transactions doc uses snaphshot
export const itemSnapshotAttributes = [
  'entity',
  'details',
] as const

const itemAttributes = {
  updatable,
  validAtCreation,
  notUpdatable,
  known: notUpdatable.concat(updatable),
  private: privat,
  // Attribute to reset on owner change
  reset: privat.concat([
    'details',
  ]),
  allowTransaction,
  doesntAllowTransaction,
  constrained: {
    transaction: {
      possibilities: itemTransactionModes,
      defaultValue: 'inventorying',
    },
  },
  snapshot: itemSnapshotAttributes,
  notIndexed: [
    'previousEntity',
    'notes',
  ],
}

export default itemAttributes
