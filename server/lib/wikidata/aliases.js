const __ = require('config').universalPath
const error_ = __.require('lib', 'error/error')

// TODO: replace this list by a SPARQL generated list
// that can be refreshed from time to time
const typesAliases = module.exports = {
  humans: [
    'wd:Q5', // human
    'wd:Q10648343', // duo
    'wd:Q14073567', // sibling duo
    'wd:Q36180', // writer
    'wd:Q19913602', // house name
    'wd:Q61002' // pseudonym
  ],
  series: [
    'wd:Q277759', // book series
    'wd:Q14406742', // comic book series
    'wd:Q21198342', // manga series
    'wd:Q74262765', // manhwa series
    'wd:Q1667921', // novel series
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
    'wd:Q213369' // webcomic
  ],
  works: [
    'wd:Q571', // book
    'wd:Q47461344', // written work
    'wd:Q2831984', // comic book album
    'wd:Q1004', // bande dessinée / comic book
    'wd:Q1760610', // comic book
    'wd:Q838795', // comic strip
    'wd:Q8261', // novel / roman
    'wd:Q149537', // novella
    'wd:Q725377', // graphic novel
    'wd:Q25379', // theatre play
    'wd:Q7725634', // literary work
    'wd:Q17518870', // group of literary works
    'wd:Q12106333', // poetry collection
    'wd:Q1279564', // short story collection
    'wd:Q386724', // work
    'wd:Q49084', // short story / conte
    'wd:Q17991521', // tale
    'wd:Q699', // fairy tale
    'wd:Q34620', // Greek tragedy
    'wd:Q8274', // manga
    'wd:Q562214', // manhwa
    'wd:Q128093', // ebook
    'wd:Q17518461', // posthumous work
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
    'wd:Q234460' // text
  ],
  editions: [
    'wd:Q3331189', // edition
    'wd:Q3972943' // publishing
  ],
  articles: [
    'wd:Q191067', // article
    'wd:Q13442814' // scientific article
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
    'wd:Q13136' // reference work
  ],
  publishers: [
    'wd:Q2085381', // publisher
    'wd:Q1320047', // book publishing company
    'wd:Q1114515', // comics publishing company
    'wd:Q149985', // self-publishing company
    'wd:Q1568650', // self-publishing (author == publisher)
    'wd:Q19720188', // small publisher
    'wd:Q19720190', // medium size publisher
    'wd:Q19720191', // large publisher
    'wd:Q45400320' // open access publisher
  ],
  // Types required to update the entity search engine
  // see server/controllers/entities/lib/update_search_engine
  collections: [
    'wd:Q20655472', // editorial collection
    'wd:Q1700470', // monographic series
    'wd:Q2668072' // collection
  ],
  movements: [
    'wd:Q2198855', // cultural movement
    'wd:Q3326717', // literary movement
    'wd:Q968159', // art movement
    'wd:Q23834194', // literary group
    'wd:Q5891', // philosophy
    'wd:Q49773', // social movement
    'wd:Q2738074' // political movement
  ],
  // Types to ignore (Category pages, homonymie, etc.)
  meta: [
    'wd:Q4167836', // Wikimedia category
    'wd:Q4167410' // Wikimedia disambiguation page
  ]
}

const types = {}

for (let type in typesAliases) {
  // Drop the plural form, including when deriving from English uses,
  // notably: series => serie
  const typeIds = typesAliases[type]
  type = type.replace(/s$/, '')
  for (const id of typeIds) {
    types[id] = type
  }
}

const typesNames = Object.keys(typesAliases)

const getPluralType = singularType => {
  const pluralizedType = singularType + 's'
  if (!typesAliases[pluralizedType]) throw error_.new('invalid type', { singularType })
  return pluralizedType
}

const getPluralTypeByTypeUri = uri => types[uri] ? `${types[uri]}s` : null

const getSingularType = type => type.replace(/s$/, '')

const getSingularTypes = types => types.map(getSingularType)

module.exports = {
  types,
  typesAliases,
  typesNames,
  getPluralType,
  getPluralTypeByTypeUri,
  getSingularType,
  getSingularTypes
}
