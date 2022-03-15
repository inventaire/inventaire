require('module-alias/register')
const { simplify } = require('wikidata-sdk')
const formatClaims = require('server/lib/wikidata/format_claims')

module.exports = entity => {
  entity.uri = `wd:${entity.id}`
  entity.labels = simplify.labels(entity.labels)
  entity.descriptions = simplify.descriptions(entity.descriptions)
  entity.aliases = simplify.aliases(entity.aliases)
  entity.claims = formatClaims(entity.claims)
  delete entity.sitelinks
  return entity
}
