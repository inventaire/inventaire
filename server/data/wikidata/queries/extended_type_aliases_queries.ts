import { chunk, difference } from 'lodash-es'
import { typesAliases, type PluralizedEntityType } from '#lib/wikidata/aliases'
import type { WdEntityUri } from '#server/types/entity'

const {
  editions: editionP31Values,
  works: workP31Values,
  series: serieP31Values,
  humans: humanP31Values,
  publishers: publisherP31Values,
  collections: collectionP31Values,
} = typesAliases

function basicSubclassesQuery (P31Values: WdEntityUri[]) {
  return `SELECT DISTINCT ?type {
    VALUES (?wellknown_type) { ${P31Values.map(uri => `(${uri})`).join(' ')} }
    ?type wdt:P279+ ?wellknown_type .
    FILTER NOT EXISTS { ?type wdt:P31 ?wellknown_type }
    FILTER EXISTS { ?instance wdt:P31 ?type }
  }`
}

const editionsAliasesQuery = basicSubclassesQuery(editionP31Values)

const tailoredWellknownWorkTypes = difference(workP31Values, [
  'wd:Q571', // book
  'wd:Q386724', // work
  'wd:Q234460', // text
  'wd:Q47461344', // written work (has too many subclasses, some with large irrelevant subgraphs, ex: software (wd:Q7397))
  'wd:Q11826511', // work of science
])
// Querying by chunks reduces risks of timeout and helps debug which subgraph is posing problem
const worksAliasesQuery = chunk(tailoredWellknownWorkTypes, 3).map(idsBatch => `SELECT DISTINCT ?type {
  VALUES (?wellknown_type) { ${idsBatch.map(uri => `(${uri})`).join(' ')} }
  ?type wdt:P279+ ?wellknown_type .
  FILTER NOT EXISTS { ?type wdt:P31 ?wellknown_type }
  FILTER EXISTS { ?instance wdt:P31 ?type }
  }`)

const seriesAliasesQuery = basicSubclassesQuery(serieP31Values)

// TODO: include collectives
const humansAliasesQuery = `SELECT DISTINCT ?type {
  VALUES (?wellknown_type) { ${humanP31Values.map(uri => `(${uri})`).join(' ')} }
  ?type wdt:P279+ ?wellknown_type .
  FILTER NOT EXISTS { ?type wdt:P31 ?wellknown_type }
  FILTER EXISTS { ?instance wdt:P31 ?type }
}`

const publishersAliasesQuery = basicSubclassesQuery(publisherP31Values)

const collectionsAliasesQuery = basicSubclassesQuery(collectionP31Values)

export const extendedAliasesQueries = {
  editions: editionsAliasesQuery,
  works: worksAliasesQuery,
  series: seriesAliasesQuery,
  humans: humansAliasesQuery,
  publishers: publishersAliasesQuery,
  collections: collectionsAliasesQuery,
} satisfies Partial<Record<PluralizedEntityType, string | string[]>>
