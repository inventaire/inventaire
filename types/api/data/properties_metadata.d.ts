import type { properties } from '#controllers/entities/lib/properties/properties'

export type PropertiesMetadata = typeof properties

export interface PropertiesMetadataResponse {
  properties: typeof properties
}
