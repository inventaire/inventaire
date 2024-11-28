import { difference } from 'lodash-es'
import { getHashCode } from '#lib/utils/base'
import { primaryTypesAliases, type PluralizedEntityType } from '#lib/wikidata/aliases'
import type { WdEntityUri } from '#types/entity'

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
  let body = `
    VALUES (?wellknown_type) { ${primaryP31Values.map(uri => `(${uri})`).join(' ')} }
    ?type wdt:P279${recursiveSubclass ? '+' : ''} ?wellknown_type .
    FILTER NOT EXISTS { ?type wdt:P31 ?wellknown_type }
  `
  if (denylist.length > 0) {
    body += `
      VALUES (?excluded_type) { ${denylist.map(uri => `(${uri})`).join(' ')} }
      FILTER(?type NOT IN (${denylist.join(',')}))
      FILTER NOT EXISTS { ?type wdt:P279 ?excluded_type }
    `
  }
  return `SELECT DISTINCT ?type { ${body} }`
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
  'wd:Q109551565', // sub-set of literature
] as WdEntityUri[]
const seriesAliasesQuery = genericSubclassesQuery(serieP31Values, seriesDenylist, false)

const tailoredWellknownHumanTypes = difference(humanP31Values, [
  'wd:Q5', // human, has a lot of subclasses but they are not used as P31 values
]) as WdEntityUri[]
const humansAliasesQuery = genericSubclassesQuery(tailoredWellknownHumanTypes, [], true)

const publishersDenylist = [
  'wd:Q28750955', // self-published work (sometimes used as P123 value)
] as WdEntityUri[]
const publishersAliasesQuery = genericSubclassesQuery(publisherP31Values, publishersDenylist)

const collectionsDenylist = [
  ...serieP31Values,
]
const collectionsAliasesQuery = genericSubclassesQuery(collectionP31Values, collectionsDenylist)

const genresDenylist = [
  ...serieP31Values,
]
const genresAliasesQuery = genericSubclassesQuery(genreP31Values, genresDenylist)

const movementsQuery = genericSubclassesQuery(movementP31Values, genreP31Values)

export const extendedAliasesQueries = {
  // Keep collections before series and series before works, so that collections and series aliases can be removed from series and works aliases
  collections: collectionsAliasesQuery,
  series: seriesAliasesQuery,
  works: worksAliasesQueries,
  humans: humansAliasesQuery,
  publishers: publishersAliasesQuery,
  // Keep movements above genre, to keep subclasses intersections on movements side
  movements: movementsQuery,
  genres: genresAliasesQuery,
  // editions: editionsAliasesQuery, // Commented-out, to avoid conflicts with works, and assuming that wellknown edition types are used
  // languages: genericSubclassesQuery(languageP31Values), // Commented-out, to avoid conflicts with works(!!)
} satisfies Partial<Record<PluralizedEntityType, string | string[]>>

export function getExtendedAliasesQueriesHash () {
  const stringifiedQueries = JSON.stringify(extendedAliasesQueries)
  return getHashCode(stringifiedQueries)
}
