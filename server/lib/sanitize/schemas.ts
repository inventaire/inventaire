import type { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types.js'

export const stringArraySchema: OpenAPIV3.SchemaObject = {
  type: 'array',
  items: {
    type: 'string',
  },
}
