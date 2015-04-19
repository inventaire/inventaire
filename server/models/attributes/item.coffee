module.exports = attributes = {}

attributes.updatable = [
  'transaction'
  'pictures'
  'listing'
  'details'
  'notes'
]

attributes.constrained =
  transaction:
    possibilities: [ 'giving', 'lending', 'selling', 'inventorying' ]
    defaultValue: 'inventorying'
  listing:
    possibilities: [ 'private', 'friends', 'public' ]
    defaultValue: 'private'
