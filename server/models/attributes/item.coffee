module.exports = attributes = {}

attributes.updatable = [
  'transaction'
  'pictures'
  'listing'
  'comment'
  'notes'
]

attributes.constrained =
  transaction:
    possibilities: [ 'giving', 'lending', 'selling', 'inventorying' ]
    defaultValue: 'inventorying'
  listing:
    possibilities: [ 'private', 'friends', 'public' ]
    defaultValue: 'private'
