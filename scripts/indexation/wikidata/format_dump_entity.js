import { simplify } from 'wikidata-sdk'
import formatClaims from '#lib/wikidata/format_claims'

export default entity => {
  entity.uri = `wd:${entity.id}`
  entity.labels = simplify.labels(entity.labels)
  entity.descriptions = simplify.descriptions(entity.descriptions)
  entity.aliases = simplify.aliases(entity.aliases)
  entity.claims = formatClaims(entity.claims)
  delete entity.sitelinks
  return entity
}
