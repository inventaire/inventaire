import { pick } from 'lodash-es'
import type { EndpointSpecs } from '#types/api/specifications'

export function formatTag (endpointSpecs: EndpointSpecs) {
  return pick(endpointSpecs, [ 'name', 'description', 'externalDocs' ])
}
