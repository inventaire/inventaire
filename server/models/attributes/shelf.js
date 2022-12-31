const attributes = {}

export default attributes

attributes.updatable = [
  'description',
  'visibility',
  'name',
  'color',
]

attributes.validAtCreation = attributes.updatable.concat([
  'owner'
])

attributes.private = [
  'visibility',
]
