const attributes = module.exports = {}

attributes.updatable = [
  'description',
  'listing',
  'name',
  'owner'
]

attributes.constrained = {
  listing: {
    possibilities: [ 'private', 'network', 'public' ],
    defaultValue: 'private'
  }
}
