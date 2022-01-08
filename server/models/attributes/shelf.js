const attributes = module.exports = {}

attributes.updatable = [
  'description',
  'listing',
  'name',
  'color',
]

attributes.validAtCreation = attributes.updatable.concat([
  'owner'
])

attributes.constrained = {
  listing: {
    possibilities: [ 'private', 'network', 'public' ],
    defaultValue: 'private'
  }
}
