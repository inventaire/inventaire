module.exports = attributes = {}

attributes.updatable = [
  'transaction'
  'pictures'
  'listing'
  'details'
  'notes'
  'authors'
]

notUpdatable = [
  '_id'
  '_rev'
  'title'
  'entity'
  'owner'
  'created'
  'updated'
]

attributes.known = notUpdatable.concat attributes.updatable

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
