const updatable = [
  'description',
  'visibility',
  'name',
  'color',
] as const

export default {
  updatable,
  validAtCreation: [ ...updatable, 'owner' ] as const,
  private: [
    'visibility',
  ] as const,
}

export type UpdatableShelfAttributes = typeof updatable[number]
