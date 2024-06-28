const updatable = [
  'description',
  'visibility',
  'name',
]

export default {
  updatable,
  validAtCreation: updatable.concat([
    'creator',
    'type',
  ]),
  type: [ 'work' ],
}
