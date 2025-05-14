import type { MethodsAndActionsControllers } from '#types/controllers'
import type { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types.js'

export interface EndpointSpecs extends OpenAPIV3.TagObject {
  controllers: MethodsAndActionsControllers
}
