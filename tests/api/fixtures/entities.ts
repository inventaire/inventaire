import calculateCheckDigit from 'isbn3/lib/calculate_check_digit.js'
import { map, random, sampleSize } from 'lodash-es'
import wdk from 'wikibase-sdk/wikidata.org'
import { prefixifyWd } from '#controllers/entities/lib/prefix'
import type { AwaitableUserWithCookie } from '#fixtures/users'
import { isEntityUri } from '#lib/boolean_validations'
import { sha1 } from '#lib/crypto'
import { isValidIsbn, toIsbn13h } from '#lib/isbn/isbn'
import { forceArray } from '#lib/utils/base'
import { requireJson } from '#lib/utils/json'
import type { Url } from '#server/types/common'
import type { Claims, EntityType, EntityUri, InvEntityUri, Labels, PropertyUri, SerializedEntity, WdEntityId, WdEntityUri } from '#server/types/entity'
import type { ImageHash } from '#server/types/image'
import type { Item } from '#server/types/item'
import { customAuthReq, request } from '#tests/api/utils/request'
import { getByUri, addClaim } from '../utils/entities.js'
import { authReq, getUser } from '../utils/utils.js'
import { firstName, humanName, randomWords } from './text.js'
import type { WikimediaLanguageCode } from 'wikibase-sdk'

const wdIdByWmLanguageCode = requireJson('wikidata-lang/mappings/wd_id_by_wm_code.json')

export const someImageHash = 'aaaaaaaaaabbbbbbbbbbccccccccccdddddddddd'

export function someRandomImageHash () {
  return sha1(Math.random().toString())
}

interface CreateEntityOptions {
  canHaveLabels?: boolean
  defaultClaims?: Claims
}
interface CreateEntityParams {
  labels?: Labels
  claims?: Claims
  user?: AwaitableUserWithCookie
}
export const createEntity = (P31: WdEntityUri, options: CreateEntityOptions = {}) => (params: CreateEntityParams = {}) => {
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

interface CreateEditionParams {
  works?: SerializedEntity[]
  work?: SerializedEntity
  title?: string
  claims?: Claims
  publisher?: WdEntityUri | InvEntityUri
  publicationDate?: string
  image?: ImageHash
  lang?: WikimediaLanguageCode
}
export async function createEdition (params: CreateEditionParams = {}) {
  const { work } = params
  let { works, title, claims, publisher, publicationDate, image } = params
  publisher = publisher || 'wd:Q1799264'
  publicationDate = publicationDate || '2020'
  const lang = params.lang || 'en'
  if (work != null && works == null) works = [ work ]
  works = await (works || createWork())
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

interface CreateEditionWithIsbnParams {
  claims?: Claims
  publisher?: WdEntityUri | InvEntityUri
  publicationDate?: string
}
export async function createEditionWithIsbn (params: CreateEditionWithIsbnParams = {}) {
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

export function createEditionFromWorks (...works) {
  const params = { works }
  return createEdition(params)
}

export async function createWorkWithAuthor (human?: { uri: EntityUri }, label?: string) {
  const { work } = await createWorkWithSpecificRoleAuthor({ human, label, roleProperty: 'wdt:P50' })
  return work
}

export async function createWorkWithSpecificRoleAuthor ({ human, label, roleProperty }: { human?: { uri: EntityUri }, label?: string, roleProperty: PropertyUri }) {
  label = label || randomLabel()
  human = await (human || createHuman())
  const work = await authReq('post', '/api/entities?action=create', {
    labels: { en: label },
    claims: {
      'wdt:P31': [ 'wd:Q47461344' ],
      [roleProperty]: [ human.uri ],
    },
  })
  return { work, human }
}

export async function createSerieWithAuthor (params: CreateEntityParams & { human?: SerializedEntity }) {
  let { human } = params
  human = await (human || createHuman())
  const serie = await createSerie(params)
  await addAuthor(serie, human)
  return serie
}

export async function createEditionFromWorkWithAuthor () {
  const work = await createWorkWithAuthor()
  return createEditionFromWorks(work)
}

export async function createWorkWithSerie (serie: SerializedEntity) {
  const work = await createWork()
  await addSerie(work, serie)
  // Get a refreshed version of the work
  return getByUri(work.uri)
}

export async function createWorkWithAuthorAndSerie () {
  const work = await createWorkWithAuthor()
  await addSerie(work)
  // Get a refreshed version of the work
  return getByUri(work.uri)
}

export async function createEditionWithWorkAndAuthor () {
  const work = await createWorkWithAuthor()
  return createEdition({ work })
}

export async function createEditionWithWorkAuthorAndSerie () {
  const work = await createWorkWithAuthorAndSerie()
  return createEdition({ work })
}

export function createItemFromEntityUri ({ user, uri, item = {} }: { user?: AwaitableUserWithCookie, uri: EntityUri, item?: Partial<Item> }) {
  user = user || getUser()
  return customAuthReq(user, 'post', '/api/items', { ...item, entity: uri })
}

export const someFakeUri = 'inv:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

export const someBnfId = () => `1${Math.random().toString().slice(2, 9)}p`

export function someOpenLibraryId (type: EntityType = 'human') {
  const numbers = Math.random().toString().slice(2, 6)
  const typeLetter = openLibraryTypeLetters[type]
  return `OL999${numbers}${typeLetter}`
}

export function someGoodReadsId () {
  const numbers = Math.random().toString().slice(2, 7)
  return `100000000${numbers}`
}

export const someLibraryThingsWorkId = () => `999${Math.random().toString().slice(2, 7)}`

export function generateIsbn13 () {
  const isbnWithoutChecksum = `978${sampleSize('0123456789'.split(''), 9).join('')}`
  const checksum = calculateCheckDigit(isbnWithoutChecksum)
  const isbn = `${isbnWithoutChecksum}${checksum}`
  if (isValidIsbn(isbn)) return isbn
  return generateIsbn13()
}

export const generateIsbn13h = () => toIsbn13h(generateIsbn13())

export function sameFirstNameLabel (label: string) {
  const newLastName = firstName()
  const labelNames = label.split(' ')
  labelNames[1] = newLastName
  return labelNames.join(' ')
}

const addEntityClaim = (createFn, property: PropertyUri) => async (subjectEntity: SerializedEntity | EntityUri, objectEntity?: SerializedEntity | EntityUri) => {
  const subjectUri = isEntityUri(subjectEntity) ? subjectEntity : subjectEntity.uri
  let objectUri, entity
  if (objectEntity) {
    objectUri = isEntityUri(objectEntity) ? objectEntity : objectEntity.uri
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

export const someReference = {
  'wdt:P854': [ 'https://catalogue.bnf.fr/ark:/12148/cb437169336' ],
  'wdt:P813': [ '2024-04-23' ],
}

export const someReferenceB = {
  'wdt:P854': [ 'https://catalogue.bnf.fr/ark:/12148/cb11908111q' ],
  'wdt:P813': [ '2024-04-24' ],
}

const { cirrusSearchPages, parse } = wdk

export async function getSomeWdEditionUri () {
  const url = cirrusSearchPages({
    haswbstatement: [ 'P31=Q3331189', 'P629' ],
    limit: 1,
    offset: random(0, 10000),
    prop: [],
  }) as Url
  const res = await request('get', url)
  const id = parse.pagesTitles(res)[0] as WdEntityId
  return prefixifyWd(id)
}
