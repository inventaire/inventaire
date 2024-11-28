import { chain } from 'lodash-es'
import { workAuthorRelationsProperties } from '#controllers/entities/lib/properties/properties'
import type { SerializedEntity } from '#types/entity'
import type { EntitySeed } from '#types/resolver'

export function getAuthorsUris (work: SerializedEntity | EntitySeed) {
  return chain(work.claims)
  .pick(workAuthorRelationsProperties)
  .values()
  .flatten()
  .uniq()
  .value()
}
