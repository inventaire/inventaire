import { trim } from 'lodash-es'
import { allLocallyEditedEntitiesTypes } from '#controllers/entities/lib/properties/properties_values_constraints'
import { isImageHash, isPositiveIntegerString, isSimpleDay, isUrl, isWdEntityUri } from '#lib/boolean_validations'
import { EntityUri } from '#lib/regex'
import { boundedString } from '#models/validations/common'

export const entity = {
  datatype: 'entity',
  primitiveType: 'string',
  format: trim,
  validate: ({ value }: { value: string }) => EntityUri.test(value),
} as const

export const remoteEntity = {
  datatype: 'entity',
  primitiveType: 'string',
  format: trim,
  validate: ({ value }: { value: string }) => isWdEntityUri(value),
  remoteEntityOnly: true,
} as const

export const string = {
  datatype: 'string',
  primitiveType: 'string',
  format: trim,
  // Aligning max length on Wikidata's limit
  validate: ({ value }) => boundedString(value, 1, 1500),
} as const

export const uniqueString = {
  ...string,
  uniqueValue: true,
} as const

export const workEntity = { ...entity, entityValueTypes: [ 'work' ] } as const
export const serieEntity = { ...entity, entityValueTypes: [ 'serie' ] } as const
export const workOrSerieEntity = { ...entity, entityValueTypes: [ 'work', 'serie' ] } as const
export const humanEntity = { ...entity, entityValueTypes: [ 'human' ] } as const
export const publisherEntity = { ...entity, entityValueTypes: [ 'publisher' ] } as const
export const collectionEntity = { ...entity, entityValueTypes: [ 'collection' ] } as const
export const movementEntity = { ...entity, entityValueTypes: [ 'movement' ] } as const
export const genreEntity = { ...entity, entityValueTypes: [ 'genre' ] } as const
export const languageEntity = { ...entity, entityValueTypes: [ 'language' ] } as const
export const uniqueEntity = { ...entity, uniqueValue: true } as const

export const concurrentAndUniqueString = { ...uniqueString, concurrency: true } as const
export const concurrentAndUniqueExternalId = { ...concurrentAndUniqueString, datatype: 'external-id' } as const

export const url = {
  datatype: 'url',
  primitiveType: 'string',
  format: trim,
  validate: ({ value }: { value: string }) => isUrl(value),
} as const

export const uniqueSimpleDay = {
  datatype: 'date',
  primitiveType: 'string',
  format: trim,
  validate: ({ value }: { value: string }) => isSimpleDay(value),
  uniqueValue: true,
} as const

export const positiveInteger = {
  datatype: 'positive-integer',
  primitiveType: 'number',
  validate: ({ value }: { value: number }) => Number.isInteger(value) && value > 0,
  uniqueValue: true,
} as const

export const positiveIntegerString = {
  datatype: 'positive-integer-string',
  primitiveType: 'string',
  format: trim,
  validate: ({ value }: { value: string }) => isPositiveIntegerString(value),
  uniqueValue: true,
} as const

export const imageHash = {
  datatype: 'image',
  primitiveType: 'string',
  format: trim,
  validate: ({ value }: { value: string }) => isImageHash(value),
  uniqueValue: true,
} as const

export const entityType = {
  datatype: 'entity-type',
  primitiveType: 'string',
  format: trim,
  validate: ({ value }) => {
    return allLocallyEditedEntitiesTypes.includes(value)
  },
  editAccessLevel: 'admin',
  remoteEntityOnly: true,
} as const
