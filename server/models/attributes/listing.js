const attributes = {}

export default attributes

attributes.updatable = [
  'description',
  'visibility',
  'name',
]

attributes.validAtCreation = attributes.updatable.concat([
  'creator',
])
