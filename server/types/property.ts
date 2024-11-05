import type { EntityType, ExtendedEntityType, InvClaimValue } from '#types/entity'

export type PropertyDatatype =
  'entity' |
  'string' |
  'external-id' |
  'url' |
  'date' |
  'positive-integer' |
  'positive-integer-string' |
  'image' |
  'entity-type'

export type PrimitiveType = 'string' | 'number'

export interface PropertyValidationArgs {
  value: InvClaimValue
  entityType?: EntityType
}

export interface PropertyValueConstraints {
  datatype: PropertyDatatype
  primitiveType: PrimitiveType
  validate: ({ value, entityType }: PropertyValidationArgs) => boolean
  format?: (value: InvClaimValue) => InvClaimValue
  uniqueValue?: boolean
  concurrency?: boolean
  adminEditOnly?: boolean
  adminUpdateOnly?: boolean
  entityValueTypes?: Readonly<ExtendedEntityType[]>
  typeSpecificValidation?: boolean
  hasPlaceholders?: boolean
  remoteEntityOnly?: boolean
}
