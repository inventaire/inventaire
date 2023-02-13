import wdk from 'wikidata-sdk'
import { languagesProperties } from '#controllers/entities/lib/languages'
import formatClaims from '#lib/wikidata/format_claims'

const { simplify } = wdk

export default (entity, specialCase) => {
  entity.uri = `wd:${entity.id}`
  entity.labels = simplify.labels(entity.labels)
  entity.descriptions = simplify.descriptions(entity.descriptions)
  entity.aliases = simplify.aliases(entity.aliases)
  if (specialCase === 'language') {
    entity.claims = formatClaims(entity.claims, languagesProperties)
  } else {
    entity.claims = formatClaims(entity.claims)
  }
  delete entity.sitelinks
  return entity
}
