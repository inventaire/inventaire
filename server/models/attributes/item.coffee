module.exports = attributes = {}

attributes.updatable = [
  'transaction'
  'pictures'
  'listing'
  'details'
  'notes'
  'snapshot'
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
  # For the list of attributes that can be in an item.snapshot object
  # see server/models/tests/item.coffee inLocalSnapshot
  # Snapshot data follow there source document: changes on the item entity
  # will be reflected in the item's snapshot data
  'snapshot'
  # Required for items created from a language-ambiguous entity (like a work)
  # to determine from which language the title should be snapshoted
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
 'title'
 'entity'
 'pictures'
 'details'
]
