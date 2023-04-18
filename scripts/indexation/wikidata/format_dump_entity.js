import { simplifyAliases, simplifyDescriptions, simplifyLabels } from 'wikibase-sdk'
import formatClaims from '#lib/wikidata/format_claims'

export default entity => {
  entity.uri = `wd:${entity.id}`
  entity.labels = simplifyLabels(entity.labels)
  entity.descriptions = simplifyDescriptions(entity.descriptions)
  entity.aliases = simplifyAliases(entity.aliases)
  entity.claims = formatClaims(entity.claims)
  delete entity.sitelinks
  return entity
}
