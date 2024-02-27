const updatable = [
  'description',
  'visibility',
  'name',
  'color',
]

export default {
  updatable,
  validAtCreation: updatable.concat([
    'owner',
  ]),
  private: [
    'visibility',
  ],
}
