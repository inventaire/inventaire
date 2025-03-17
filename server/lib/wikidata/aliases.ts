import { allowedValuesPerTypePerProperty } from '#controllers/entities/lib/properties/allowed_values_per_type_per_property'
import { newError } from '#lib/error/error'
import { objectEntries } from '#lib/utils/base'
import { objectKeys } from '#lib/utils/types'
import type { ExtendedEntityType, WdEntityUri } from '#types/entity'

const { 'wdt:P31': invP31Values } = allowedValuesPerTypePerProperty

// Those Wikidata items are the basic aliases from which extended aliases lists
// will be found by following subclasses (wdt:P279), with some exceptions
// See scripts/entities_extended_types_aliases/extended_type_aliases_queries.ts
const wikidataOnlyP31Values = {
  humans: [
    'wd:Q10648343', // duo
    'wd:Q14073567', // sibling duo
    'wd:Q19913602', // house name
    'wd:Q61002', // pseudonym
    'wd:Q16017119', // collective pseudonym
    'wd:Q1400264', // artist collective
    'wd:Q334471', // manga artist group
    'wd:Q1690980', // group of authors
  ],
  series: [
    'wd:Q3297186', // limited series
    'wd:Q21191134', // comic strip series
    'wd:Q17489659', // group of works
    'wd:Q867335', // literary cycle
    'wd:Q1700470', // monographic series
    'wd:Q13593966', // literary trilogy
    'wd:Q17710980', // literary tetralogy
    'wd:Q17710986', // literary pentalogy
    'wd:Q52269333', // literary hexalogy
    'wd:Q53843792', // literary dylogy
    'wd:Q2005755', // novel sequence
    'wd:Q21190961', // fumetti series
    'wd:Q2620972', // story arc
  ],
  works: [
    'wd:Q571', // book
    'wd:Q2831984', // comic book album
    'wd:Q838795', // comic strip
    'wd:Q149537', // novella
    'wd:Q17518870', // group of literary works
    'wd:Q12106333', // poetry collection
    'wd:Q1279564', // short story collection
    'wd:Q386724', // work
    'wd:Q49084', // short story / conte
    'wd:Q17991521', // tale
    'wd:Q699', // fairy tale
    'wd:Q34620', // Greek tragedy
    'wd:Q128093', // ebook
    'wd:Q17518461', // posthumous work
    'wd:Q12765855', // philosophical work
    'wd:Q179461', // religious text
    'wd:Q27560760', // сollection of fairy tales
    'wd:Q23622', // dictionary
    'wd:Q2352616', // catalogue
    'wd:Q780605', // exhibition catalogue
    'wd:Q5185279', // poem
    'wd:Q37484', // epic poem
    'wd:Q10901350', // anime and manga
    'wd:Q20540385', // non-fiction book
    'wd:Q36279', // biography
    'wd:Q234460', // text
    'wd:Q193934', // paperback
    'wd:Q193955', // hardback
    'wd:Q17994250', // pocket edition
    'wd:Q1238720', // volume
    'wd:Q193495', // monograph
    'wd:Q83818856', // grammar book
    'wd:Q12799318', // short novel
    'wd:Q10992055', // fantasy novel
    'wd:Q1391417', // specialized dictionary
    'wd:Q35760', // essay
    'wd:Q16363676', // manual
    'wd:Q11826511', // work of science
    'wd:Q116476516', // dramatic work
    'wd:Q11825892', // young adult novel
    'wd:Q8275050', // children's book
    'wd:Q747381', // light novel
    'wd:Q13136', // reference work
  ],
  editions: [
    'wd:Q3972943', // publishing
    'wd:Q57933693', // book edition
  ],
  articles: [
    'wd:Q191067', // article
    'wd:Q13442814', // scientific article
  ],
  genres: [
    'wd:Q483394', // genre
    'wd:Q223393', // literary genre
    'wd:Q1792379', // art genre
    'wd:Q4894405', // journalism genre
    'wd:Q5151404', // comedic genre
    'wd:Q21114848', // magazine genre
    'wd:Q20087698', // comics genre
    'wd:Q28468127', // target audience for manga
    'wd:Q108368282', // literary genre by form
    'wd:Q108317211', // novel genre
    'wd:Q20076756', // speculative fiction genre
  ],
  publishers: [
    'wd:Q1320047', // book publishing company
    'wd:Q1114515', // comics publishing company
    'wd:Q149985', // self-publishing company
    'wd:Q1568650', // self-publishing (author == publisher)
    'wd:Q19720188', // small publisher
    'wd:Q19720190', // medium size publisher
    'wd:Q19720191', // large publisher
    'wd:Q45400320', // open access publisher
    'wd:Q479716', // publisher associated with a university
    'wd:Q3579158', // board game publishing company
    'wd:Q1661080', // small press
  ],
  collections: [],
  movements: [
    'wd:Q2198855', // cultural movement
    'wd:Q3326717', // literary movement
    'wd:Q968159', // art movement
    'wd:Q23834194', // literary group
    'wd:Q5891', // philosophy
    'wd:Q49773', // social movement
    'wd:Q2738074', // political movement
  ],
  languages: [
    'wd:Q34770', // language
    'wd:Q1288568', // modern language
    'wd:Q38058796', // extinct language
    'wd:Q45762', // dead language
    'wd:Q33384', // dialect
    'wd:Q33742', // natural language
    'wd:Q34228', // sign language
    'wd:Q436240', // ancient language
    'wd:Q2315359', // historical language
    'wd:Q315', // language
    'wd:Q33215', // constructed language
    'wd:Q838296', // international auxiliary language
    'wd:Q2519134', // engineered language
    'wd:Q17376908', // languoid
    'wd:Q838296', // international auxiliary language
    'wd:Q1149626', // written language
    'wd:Q1208380', // dialect group
    'wd:Q152559', // ISO 639-3 macrolanguage
    'wd:Q33289', // creole language
    'wd:Q399495', // standard language
    'wd:Q43091', // orthography
    'wd:Q64362969', // language in script
    'wd:Q839470', // sacred language
  ],
  // Types to ignore (Category pages, homonymie, etc.)
  meta: [
    'wd:Q4167836', // Wikimedia category
    'wd:Q4167410', // Wikimedia disambiguation page
  ],
} as const

export type PluralizedEntityType = keyof typeof wikidataOnlyP31Values

export type TypesAliases = Record<PluralizedEntityType, WdEntityUri[]>
export const primaryTypesAliases = {} as TypesAliases

for (const [ type, wdTypeValues ] of objectEntries(wikidataOnlyP31Values)) {
  const invTypeValues = invP31Values[type] || []
  primaryTypesAliases[type] = [ ...wdTypeValues, ...invTypeValues ]
}

export type EntityTypeByP31Value = Record<WdEntityUri, ExtendedEntityType>

export function getTypesFromTypesAliases (aliases: TypesAliases) {
  const entityTypeByP31Value: EntityTypeByP31Value = {}

  for (const [ type, typeIds ] of objectEntries(aliases)) {
    // Drop the plural form, including when deriving from English uses,
    // notably: series => serie
    const singularType = type.replace(/s$/, '') as ExtendedEntityType
    for (const id of typeIds) {
      entityTypeByP31Value[id] = singularType
    }
  }
  return entityTypeByP31Value
}

export const typesByPrimaryP31AliasesValues = getTypesFromTypesAliases(primaryTypesAliases)

export const typesNames = objectKeys(primaryTypesAliases)

export function getPluralType (singularType: string) {
  const pluralizedType = singularType + 's'
  if (!primaryTypesAliases[pluralizedType]) throw newError('invalid type', 500, { singularType })
  return pluralizedType
}

export const getPluralTypeByTypeUri = uri => typesByPrimaryP31AliasesValues[uri] ? `${typesByPrimaryP31AliasesValues[uri]}s` : null

export const getSingularType = type => type.replace(/s$/, '')

export const getSingularTypes = types => types.map(getSingularType)
