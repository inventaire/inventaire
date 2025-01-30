import type { InvEntity, SerializedEntity } from '#types/entity'
import type { Item as WdEntity } from 'wikibase-sdk'

export function getEntityId (entity: SerializedEntity | WdEntity | InvEntity) {
  if ('wdId' in entity) return entity.wdId
  if ('invId' in entity) return entity.invId
  // Working around differences in entities formatting between
  // - Wikidata entities from a dump or from Wikidata API (entity.id)
  // - Wikidata entities with inventaire formatting (entity.uri)
  //   (returned in case of Inventaire entity redirection)
  // - Inventaire entities (entity.uri)
  if ('uri' in entity && typeof entity.uri === 'string') return entity.uri.split(':')[1]
  // @ts-expect-error
  return entity.id || entity._id
}
