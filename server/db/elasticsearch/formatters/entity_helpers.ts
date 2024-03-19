export function getEntityId (entity) {
  // Working around differences in entities formatting between
  // - Wikidata entities from a dump or from Wikidata API (entity.id)
  // - Wikidata entities with inventaire formatting (entity.uri)
  //   (returned in case of Inventaire entity redirection)
  // - Inventaire entities (entity.uri)
  if (entity.uri) return entity.uri.split(':')[1]
  else return entity.id || entity._id
}
