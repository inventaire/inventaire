import type { EntityType, InvClaimValue } from '#types/entity'

export type PropertyDatatype =
  'entity' |
  'string' |
  'external-id' |
  'url' |
  'date' |
  'positive-integer' |
  'positive-integer-string' |
  'image'

export type PrimitiveType = 'string' | 'number'

export interface PropertyValueConstraints {
  datatype: PropertyDatatype
  primitiveType: PrimitiveType
  validate: (value: InvClaimValue) => boolean
  format?: (value: InvClaimValue) => InvClaimValue
  uniqueValue?: boolean
  concurrency?: boolean
  adminUpdateOnly?: boolean
  entityValueTypes?: EntityType[]
}
