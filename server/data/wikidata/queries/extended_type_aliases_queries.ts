import { chunk, difference } from 'lodash-es'
import { typesAliases, type PluralizedEntityType } from '#lib/wikidata/aliases'
import type { WdEntityUri } from '#server/types/entity'

const {
  // editions: editionP31Values,
  works: workP31Values,
  series: serieP31Values,
  humans: humanP31Values,
  publishers: publisherP31Values,
  collections: collectionP31Values,
  genres: genreP31Values,
  movements: movementP31Values,
  // languages: languageP31Values,
} = typesAliases

function basicSubclassesQuery (P31Values: WdEntityUri[], recursiveSubclass = true) {
  return `SELECT DISTINCT ?type {
    VALUES (?wellknown_type) { ${P31Values.map(uri => `(${uri})`).join(' ')} }
    ?type wdt:P279${recursiveSubclass ? '+' : ''} ?wellknown_type .
    FILTER NOT EXISTS { ?type wdt:P31 ?wellknown_type }
  }`
}

// const editionsAliasesQuery = basicSubclassesQuery(editionP31Values, true)

const tailoredWellknownWorkTypes = difference(workP31Values, [
  'wd:Q571', // book
  'wd:Q386724', // work
  'wd:Q234460', // text
  'wd:Q7725634', // literary work (has too many subclasses, some with large irrelevant subgraphs, ex: song (wd:Q7366))
  'wd:Q47461344', // written work (has too many subclasses, some with large irrelevant subgraphs, ex: software (wd:Q7397))
  'wd:Q11826511', // work of science
])
// Querying by chunks reduces risks of timeout and helps debug which subgraph is posing problem
const worksAliasesQuery = chunk(tailoredWellknownWorkTypes, 3).map(urisBatch => `SELECT DISTINCT ?type {
  VALUES (?wellknown_type) { ${workP31Values.map(uri => `(${uri})`).join(' ')} }
  VALUES (?wellknown_type_chunk) { ${urisBatch.map(uri => `(${uri})`).join(' ')} }
  ?type wdt:P279+ ?wellknown_type_chunk .
  FILTER NOT EXISTS { ?type wdt:P31 ?wellknown_type }
}`)

const seriesDenylist = [ ...workP31Values, ...collectionP31Values ]
// Disabling recursive subclasses to avoid conflicts with works
const seriesAliasesQuery = `SELECT DISTINCT ?type {
  VALUES (?wellknown_type) { ${serieP31Values.map(uri => `(${uri})`).join(' ')} }
  ?type wdt:P279 ?wellknown_type .
  FILTER(?type NOT IN (${seriesDenylist.join(',')}))
  FILTER NOT EXISTS { ?type wdt:P31 ?wellknown_type }
}`

const tailoredWellknownHumanTypes = difference(humanP31Values, [
  'wd:Q5', // human, has a lot of subclasses but they are not used as P31 values
])
const humansAliasesQuery = `SELECT DISTINCT ?type {
  VALUES (?wellknown_type) { ${tailoredWellknownHumanTypes.map(uri => `(${uri})`).join(' ')} }
  ?type wdt:P279+ ?wellknown_type .
  FILTER NOT EXISTS { ?type wdt:P31 ?wellknown_type }
}`

const publishersDenylist = [
  'wd:Q28750955', // self-published work (sometimes used as P123 value)
]
const publishersAliasesQuery = `SELECT DISTINCT ?type {
  VALUES (?wellknown_type) { ${publisherP31Values.map(uri => `(${uri})`).join(' ')} }
  VALUES (?excluded_type) { ${publishersDenylist.map(uri => `(${uri})`).join(' ')} }
  ?type wdt:P279+ ?wellknown_type .
  FILTER(?type NOT IN (${publishersDenylist.join(',')}))
  FILTER NOT EXISTS { ?type wdt:P279 ?excluded_type }
  FILTER NOT EXISTS { ?type wdt:P31 ?wellknown_type }
}`

const collectionsDenylist = [
  'wd:Q1700470', // monograph series (let it to series)
]
const collectionsAliasesQuery = `SELECT DISTINCT ?type {
  VALUES (?wellknown_type) { ${collectionP31Values.map(uri => `(${uri})`).join(' ')} }
  VALUES (?excluded_type) { ${collectionsDenylist.map(uri => `(${uri})`).join(' ')} }
  ?type wdt:P279+ ?wellknown_type .
  FILTER(?type NOT IN (${collectionsDenylist.join(',')}))
  FILTER NOT EXISTS { ?type wdt:P279 ?excluded_type }
  FILTER NOT EXISTS { ?type wdt:P31 ?wellknown_type }
}`

export const extendedAliasesQueries = {
  // Keep collections before series and series before works, so that collections and series aliases can be removed from series and works aliases
  collections: collectionsAliasesQuery,
  series: seriesAliasesQuery,
  works: worksAliasesQuery,
  humans: humansAliasesQuery,
  publishers: publishersAliasesQuery,
  genres: basicSubclassesQuery(genreP31Values, false),
  movements: basicSubclassesQuery(movementP31Values, false),
  // editions: editionsAliasesQuery, // Commented-out, to avoid conflicts with works, and assuming that wellknown edition types are used
  // languages: basicSubclassesQuery(languageP31Values), // Commented-out, to avoid conflicts with works(!!)
} satisfies Partial<Record<PluralizedEntityType, string | string[]>>
