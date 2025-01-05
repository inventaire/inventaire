import { objectKeys } from '#lib/utils/types'

const updatable = [
  'description',
  'visibility',
  'name',
] as const

const entityTypesByListingType = {
  work: [ 'work', 'serie' ],
  author: [ 'human' ],
  publisher: [ 'publisher' ],
} as const

export default {
  updatable,
  validAtCreation: [
    ...updatable,
    'creator',
    'type',
  ],
  type: objectKeys(entityTypesByListingType),
  entityTypesByListingType,
}
