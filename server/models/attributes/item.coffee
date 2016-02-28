module.exports = attributes = {}

attributes.updatable = [
  'transaction'
  'pictures'
  'listing'
  'details'
  'notes'
  'authors'
]

# not updatable by the user
notUpdatable = [
  '_id'
  '_rev'
  'title'
  'entity'
  'created'

  # updated when other attributes are updated
  'updated'

  # updated as side effects of transactions
  'busy'
  'owner'
  'history'

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
    possibilities: [ 'private', 'friends', 'public' ]
    defaultValue: 'private'


attributes.forkable = [
 'title'
 'entity'
 'pictures'
 'details'
]
