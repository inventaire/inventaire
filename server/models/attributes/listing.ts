const updatable = [
  'description',
  'visibility',
  'name',
]

const entityTypesByListingType = {
  work: [ 'work', 'serie' ],
  author: [ 'human' ],
  publisher: [ 'publisher' ],
}

export default {
  updatable,
  validAtCreation: updatable.concat([
    'creator',
    'type',
  ]),
  type: Object.keys(entityTypesByListingType),
  entityTypesByListingType,
}
