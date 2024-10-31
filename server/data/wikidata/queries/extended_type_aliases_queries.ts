import { typesAliases, type PluralizedEntityType } from '#lib/wikidata/aliases'

const {
  editions: editionP31Values,
  works: workP31Values,
  series: serieP31Values,
  humans: humanP31Values,
  publishers: publisherP31Values,
  collections: collectionP31Values,
} = typesAliases

const editionsAliasesQuery = `SELECT DISTINCT ?type {
  VALUES (?wellknown_type) { ${editionP31Values.map(uri => `(${uri})`).join(' ')} }
  ?type wdt:P279+ ?wellknown_type .
  FILTER NOT EXISTS { ?type wdt:P31 ?wellknown_type }
  FILTER EXISTS { ?instance wdt:P31 ?type }
}`

const worksAliasesQuery = `SELECT DISTINCT ?type {
  VALUES (?wellknown_type) { ${workP31Values.map(uri => `(${uri})`).join(' ')} }
  ?type wdt:P279+ ?wellknown_type .
  FILTER NOT EXISTS { ?type wdt:P31 ?wellknown_type }
  FILTER EXISTS { ?instance wdt:P31 ?type }
}`

const seriesAliasesQuery = `SELECT DISTINCT ?type {
  VALUES (?wellknown_type) { ${serieP31Values.map(uri => `(${uri})`).join(' ')} }
  ?type wdt:P279+ ?wellknown_type .
  FILTER NOT EXISTS { ?type wdt:P31 ?wellknown_type }
  FILTER EXISTS { ?instance wdt:P31 ?type }
}`

// TODO: include collectives
const humansAliasesQuery = `SELECT DISTINCT ?type {
  VALUES (?wellknown_type) { ${humanP31Values.map(uri => `(${uri})`).join(' ')} }
  ?type wdt:P279+ ?wellknown_type .
  FILTER NOT EXISTS { ?type wdt:P31 ?wellknown_type }
  FILTER EXISTS { ?instance wdt:P31 ?type }
}`

const publishersAliasesQuery = `SELECT DISTINCT ?type {
  VALUES (?wellknown_type) { ${publisherP31Values.map(uri => `(${uri})`).join(' ')} }
  ?type wdt:P279+ ?wellknown_type .
  FILTER NOT EXISTS { ?type wdt:P31 ?wellknown_type }
  FILTER EXISTS { ?instance wdt:P31 ?type }
}`

const collectionsAliasesQuery = `SELECT DISTINCT ?type {
  VALUES (?wellknown_type) { ${collectionP31Values.map(uri => `(${uri})`).join(' ')} }
  ?type wdt:P279+ ?wellknown_type .
  FILTER NOT EXISTS { ?type wdt:P31 ?wellknown_type }
  FILTER EXISTS { ?instance wdt:P31 ?type }
}`

export const extendedAliasesQueries = {
  editions: editionsAliasesQuery,
  // works: worksAliasesQuery,
  series: seriesAliasesQuery,
  // humans: humansAliasesQuery,
  publishers: publishersAliasesQuery,
  collections: collectionsAliasesQuery,
} satisfies Partial<Record<PluralizedEntityType, string>>
