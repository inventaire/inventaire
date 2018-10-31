module.exports = attributes = {}

attributes.updatable = [
  'transaction'
  'pictures'
  'listing'
  'details'
  'notes'
  # Use case: change from a work entity to an edition entity
  'entity'
]

attributes.validAtCreation = [
  'entity'
  'transaction'
  'pictures'
  'listing'
  'details'
  'notes'
  # Legacy
  'lang'
]

# not updatable by the user
notUpdatable = [
  '_id'
  '_rev'
  'lang'
  'created'

  # updated when user updatable attributes are updated
  'updated'

  # updated as side effects of transactions
  'busy'
  'owner'
  'history'

  # updated as side effects of entity redirections
  'previousEntity'

]

attributes.known = notUpdatable.concat attributes.updatable

attributes.private = [
  'notes'
  'listing'
]

# attribute to reset on owner change
attributes.reset = attributes.private.concat [
  'details'
  'busy'
]

allowTransaction = [ 'giving', 'lending', 'selling']
doesntAllowTransaction = [ 'inventorying']

attributes.allowTransaction = allowTransaction
attributes.doesntAllowTransaction = doesntAllowTransaction

attributes.constrained =
  transaction:
    possibilities: allowTransaction.concat doesntAllowTransaction
    defaultValue: 'inventorying'
  listing:
    possibilities: [ 'private', 'network', 'public' ]
    defaultValue: 'private'

# attributes to keep in documents where a stakeholder might loose
# access to those data
# ex: in a transaction, when the item isn't visible to the previous owner anymore
# Attributes such as _id and transaction are already recorded by a transaction
# thus their absence here as long as only transactions doc uses snaphshot
attributes.snapshot = [
 'entity'
 'details'
]
