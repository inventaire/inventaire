import { allowedValuesPerTypePerProperty } from '#controllers/entities/lib/properties/allowed_values_per_type_per_property'
import { properties } from '#controllers/entities/lib/properties/properties'
import { sendStaticJson } from '#lib/responses'

const stringifiedValues = JSON.stringify({
  values: allowedValuesPerTypePerProperty,
})

export function propertyValues (req, res) {
  sendStaticJson(res, stringifiedValues)
}

const stringifiedProperties = JSON.stringify({ properties })

export function propertiesMetadata (req, res) {
  sendStaticJson(res, stringifiedProperties)
}

export type PropertiesMetadata = typeof properties

export interface PropertiesMetadataResponse {
  properties: typeof properties
}
