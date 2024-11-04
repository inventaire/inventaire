import { difference } from 'lodash-es'
import { getHashCode } from '#lib/utils/base'
import { primaryTypesAliases, type PluralizedEntityType } from '#lib/wikidata/aliases'
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
  articles: articlesP31Values,
  // languages: languageP31Values,
} = primaryTypesAliases

function genericSubclassesQuery (primaryP31Values: WdEntityUri[], denylist: WdEntityUri[], recursiveSubclass = true) {
  return `SELECT DISTINCT ?type {
    VALUES (?wellknown_type) { ${primaryP31Values.map(uri => `(${uri})`).join(' ')} }
    VALUES (?excluded_type) { ${denylist.map(uri => `(${uri})`).join(' ')} }
    ?type wdt:P279${recursiveSubclass ? '+' : ''} ?wellknown_type .
    FILTER(?type NOT IN (${denylist.join(',')}))
    FILTER NOT EXISTS { ?type wdt:P279 ?excluded_type }
    FILTER NOT EXISTS { ?type wdt:P31 ?wellknown_type }
  }`
}

// const editionsAliasesQuery = genericSubclassesQuery(editionP31Values, true)

// Those have too many subclasses, some with large irrelevant subgraphs (ex: song (wd:Q7366), software (wd:Q7397))
const noRecursionWorkP31Values = [
  'wd:Q7725634',
  'wd:Q47461344',
] as WdEntityUri[]
const tailoredWellknownWorkTypes = difference(workP31Values, [
  'wd:Q571', // book
  'wd:Q386724', // work
  'wd:Q234460', // text
  'wd:Q11826511', // work of science
  ...noRecursionWorkP31Values,
]) as WdEntityUri[]
const worksDenylist = [ ...articlesP31Values, ...serieP31Values, ...collectionP31Values ]
const worksAliasesQueries = [
  genericSubclassesQuery(tailoredWellknownWorkTypes, worksDenylist, true),
  // Fetch only their direct subclasses, as fetching recursively times out
  genericSubclassesQuery(noRecursionWorkP31Values, worksDenylist, false),
]

const seriesDenylist = [
  ...workP31Values,
  ...collectionP31Values,
]
const seriesAliasesQuery = `SELECT DISTINCT ?type {
  VALUES (?wellknown_type) { ${serieP31Values.map(uri => `(${uri})`).join(' ')} }
  VALUES (?excluded_type) { ${seriesDenylist.map(uri => `(${uri})`).join(' ')} }
  ?type wdt:P279 ?wellknown_type .
  FILTER(?type NOT IN (${seriesDenylist.join(',')}))
  FILTER NOT EXISTS { ?type wdt:P279 ?excluded_type }
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
  ...serieP31Values,
]
const collectionsAliasesQuery = `SELECT DISTINCT ?type {
  VALUES (?wellknown_type) { ${collectionP31Values.map(uri => `(${uri})`).join(' ')} }
  VALUES (?excluded_type) { ${collectionsDenylist.map(uri => `(${uri})`).join(' ')} }
  ?type wdt:P279+ ?wellknown_type .
  FILTER(?type NOT IN (${collectionsDenylist.join(',')}))
  FILTER NOT EXISTS { ?type wdt:P279 ?excluded_type }
  FILTER NOT EXISTS { ?type wdt:P31 ?wellknown_type }
}`

const genresDenylist = [
  ...serieP31Values,
]
const genresAliasesQuery = `SELECT DISTINCT ?type {
  VALUES (?wellknown_type) { ${genreP31Values.map(uri => `(${uri})`).join(' ')} }
  VALUES (?excluded_type) { ${genresDenylist.map(uri => `(${uri})`).join(' ')} }
  ?type wdt:P279+ ?wellknown_type .
  FILTER NOT EXISTS { ?type wdt:P31 ?wellknown_type }
  FILTER NOT EXISTS { ?type wdt:P279 ?excluded_type }
}`

export const extendedAliasesQueries = {
  // Keep collections before series and series before works, so that collections and series aliases can be removed from series and works aliases
  collections: collectionsAliasesQuery,
  series: seriesAliasesQuery,
  works: worksAliasesQueries,
  humans: humansAliasesQuery,
  publishers: publishersAliasesQuery,
  // Keep movements above genre, to keep subclasses intersections on movements side
  movements: genericSubclassesQuery(movementP31Values, genreP31Values),
  genres: genresAliasesQuery,
  // editions: editionsAliasesQuery, // Commented-out, to avoid conflicts with works, and assuming that wellknown edition types are used
  // languages: genericSubclassesQuery(languageP31Values), // Commented-out, to avoid conflicts with works(!!)
} satisfies Partial<Record<PluralizedEntityType, string | string[]>>

export function getExtendedAliasesQueriesHash () {
  const stringifiedQueries = JSON.stringify(extendedAliasesQueries)
  return getHashCode(stringifiedQueries)
}
