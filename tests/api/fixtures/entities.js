import calculateCheckDigit from 'isbn3/lib/calculate_check_digit.js'
import { isString, map, sampleSize } from 'lodash-es'
import { isValidIsbn, toIsbn13h } from '#lib/isbn/isbn'
import { forceArray } from '#lib/utils/base'
import { requireJson } from '#lib/utils/json'
import { customAuthReq } from '#tests/api/utils/request'
import { getByUri, addClaim } from '../utils/entities.js'
import { authReq, getUser } from '../utils/utils.js'
import { firstName, humanName, randomWords } from './text.js'

const wdIdByWmLanguageCode = requireJson('wikidata-lang/mappings/wd_id_by_wm_code.json')

export const someImageHash = 'aaaaaaaaaabbbbbbbbbbccccccccccdddddddddd'

export const createEntity = (P31, options = {}) => (params = {}) => {
  const { canHaveLabels = true, defaultClaims } = options
  const defaultLabel = P31 === 'wd:Q5' ? humanName() : randomLabel(4)
  let labels
  if (canHaveLabels) {
    labels = params.labels || { en: defaultLabel }
  }
  let claims = params.claims || {}
  claims['wdt:P31'] = [ P31 ]
  if (defaultClaims) claims = Object.assign({}, defaultClaims, claims)
  const user = params.user || getUser()
  return customAuthReq(user, 'post', '/api/entities?action=create', { labels, claims })
}

export const createHuman = createEntity('wd:Q5')
export const createWork = createEntity('wd:Q47461344')
export const createSerie = createEntity('wd:Q277759')
export const createPublisher = createEntity('wd:Q2085381')
export const createCollection = createEntity('wd:Q20655472', {
  canHaveLabels: false,
  defaultClaims: {
    'wdt:P123': [ 'wd:Q1799264' ],
    'wdt:P1476': [ randomWords(4) ],
  },
})

export const randomLabel = randomWords

export const createEdition = async (params = {}) => {
  const { work } = params
  let { works, title, claims, publisher, publicationDate, image } = params
  publisher = publisher || 'wd:Q1799264'
  publicationDate = publicationDate || '2020'
  const lang = params.lang || 'en'
  if (work != null && works == null) works = [ work ]
  const worksPromise = works ? Promise.resolve(works) : createWork()
  works = await worksPromise
  works = forceArray(works)
  title = title || Object.values(works[0].labels)[0]
  const worksUris = map(works, 'uri')
  const editionClaims = Object.assign({
    'wdt:P31': [ 'wd:Q3331189' ],
    'wdt:P629': worksUris,
    'wdt:P1476': [ title ],
    'wdt:P1680': [ randomWords() ],
    'wdt:P407': [ `wd:${wdIdByWmLanguageCode[lang]}` ],
    'wdt:P123': [ publisher ],
    'wdt:P577': [ publicationDate ],
    'invp:P2': [ image || someImageHash ],
  }, claims)
  return authReq('post', '/api/entities?action=create', { claims: editionClaims })
}

export const createEditionWithIsbn = async (params = {}) => {
  const { publisher, publicationDate, claims } = params
  const work = await createWork()
  const isbn13h = generateIsbn13h()
  const editionClaims = Object.assign({
    'wdt:P31': [ 'wd:Q3331189' ],
    'wdt:P629': [ work.uri ],
    'wdt:P212': [ isbn13h ],
    'wdt:P1476': [ randomLabel() ],
    'invp:P2': [ someImageHash ],
  }, claims)
  if (publisher) editionClaims['wdt:P123'] = [ publisher ]
  if (publicationDate !== null) editionClaims['wdt:P577'] = [ publicationDate || '2020' ]
  const edition = await authReq('post', '/api/entities?action=create', { claims: editionClaims })
  edition.isbn = edition.uri.split(':')[1]
  edition.invUri = `inv:${edition._id}`
  edition.isbn13h = isbn13h
  return edition
}

export const createEditionFromWorks = (...works) => {
  const params = { works }
  return createEdition(params)
}

export const createWorkWithAuthor = async (human, label) => {
  label = label || randomLabel()
  human = await (human || createHuman())
  return authReq('post', '/api/entities?action=create', {
    labels: { en: label },
    claims: {
      'wdt:P31': [ 'wd:Q47461344' ],
      'wdt:P50': [ human.uri ],
    },
  })
}

export const createSerieWithAuthor = async params => {
  let { human } = params
  human = await (human || createHuman())
  const serie = await createSerie(params)
  await addAuthor(serie, human)
  return serie
}

export const createEditionFromWorkWithAuthor = async () => {
  const work = await createWorkWithAuthor()
  return createEditionFromWorks(work)
}

export const createWorkWithSerie = async serie => {
  const work = await createWork()
  await addSerie(work, serie)
  // Get a refreshed version of the work
  return getByUri(work.uri)
}

export const createWorkWithAuthorAndSerie = async () => {
  const work = await createWorkWithAuthor()
  await addSerie(work)
  // Get a refreshed version of the work
  return getByUri(work.uri)
}

export const createEditionWithWorkAndAuthor = async () => {
  const work = await createWorkWithAuthor()
  return createEdition({ work })
}

export const createEditionWithWorkAuthorAndSerie = async () => {
  const work = await createWorkWithAuthorAndSerie()
  return createEdition({ work })
}

export const createItemFromEntityUri = ({ user, uri, item = {} }) => {
  user = user || getUser()
  return customAuthReq(user, 'post', '/api/items', Object.assign({}, item, { entity: uri }))
}

export const someFakeUri = 'inv:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

export const someOpenLibraryId = (type = 'human') => {
  const numbers = Math.random().toString().slice(2, 6)
  const typeLetter = openLibraryTypeLetters[type]
  return `OL999${numbers}${typeLetter}`
}

export const someGoodReadsId = () => {
  const numbers = Math.random().toString().slice(2, 7)
  return `100000000${numbers}`
}

export const someLibraryThingsWorkId = () => `999${Math.random().toString().slice(2, 7)}`

export const generateIsbn13 = () => {
  const isbnWithoutChecksum = `978${sampleSize('0123456789'.split(''), 9).join('')}`
  const checksum = calculateCheckDigit(isbnWithoutChecksum)
  const isbn = `${isbnWithoutChecksum}${checksum}`
  if (isValidIsbn(isbn)) return isbn
  return generateIsbn13()
}

export const generateIsbn13h = () => toIsbn13h(generateIsbn13())

export const sameFirstNameLabel = label => {
  const newLastName = firstName()
  const labelNames = label.split(' ')
  labelNames[1] = newLastName
  return labelNames.join(' ')
}

const addEntityClaim = (createFn, property) => async (subjectEntity, objectEntity) => {
  const subjectUri = isString(subjectEntity) ? subjectEntity : subjectEntity.uri
  let objectUri, entity
  if (objectEntity) {
    objectUri = isString(objectEntity) ? objectEntity : objectEntity.uri
    entity = getByUri(objectUri)
  } else {
    entity = await createFn()
    objectUri = entity.uri
  }
  await addClaim({ uri: subjectUri, property, value: objectUri })
  return entity
}

export const addAuthor = addEntityClaim(createHuman, 'wdt:P50')
export const addSerie = addEntityClaim(createSerie, 'wdt:P179')
export const addPublisher = addEntityClaim(createPublisher, 'wdt:P123')
export const addTranslator = addEntityClaim(createHuman, 'wdt:P655')

const openLibraryTypeLetters = {
  edition: 'M',
  work: 'W',
  human: 'A',
}
