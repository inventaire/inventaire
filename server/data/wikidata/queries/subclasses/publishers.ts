import { typesAliases } from '#lib/wikidata/aliases'

const { publishers: publishersP31Values } = typesAliases

export const publishersAliasesQuery = `SELECT DISTINCT ?publisher_type {
  VALUES (?wellknown_publisher_type) { ${publishersP31Values.map(uri => `(${uri})`).join(' ')} }
  ?publisher_type wdt:P279* ?wellknown_publisher_type .
  FILTER NOT EXISTS { ?publisher_type wdt:P31 ?wellknown_publisher_type }
  FILTER EXISTS { ?publisher wdt:P31 ?publisher_type }
}`
