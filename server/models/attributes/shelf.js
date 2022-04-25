const attributes = module.exports = {}

attributes.updatable = [
  'description',
  'visibility',
  'name',
  'color',
]

attributes.validAtCreation = attributes.updatable.concat([
  'owner'
])
