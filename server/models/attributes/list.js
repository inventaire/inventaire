const attributes = module.exports = {}

attributes.updatable = [
  'description',
  'visibility',
  'name',
]

attributes.validAtCreation = attributes.updatable.concat([
  'user'
])
