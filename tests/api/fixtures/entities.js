const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { customAuthReq, authReq, getUser } = require('../utils/utils')
const isbn_ = __.require('lib', 'isbn/isbn')
const wdLang = require('wikidata-lang')
const { getByUri, addClaim } = require('../utils/entities')
const faker = require('faker')
const someImageHash = 'aaaaaaaaaabbbbbbbbbbccccccccccdddddddddd'

const createEntity = (P31, options = {}) => (params = {}) => {
  const { canHaveLabels = true, defaultClaims } = options
  const defaultLabel = P31 === 'wd:Q5' ? humanName() : API.randomLabel(4)
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

const humanName = () => faker.fake('{{name.firstName}} {{name.lastName}}')
const randomWords = length => faker.random.words(length)

const API = module.exports = {
  createEntity,
  createHuman: createEntity('wd:Q5'),
  createWork: createEntity('wd:Q47461344'),
  createSerie: createEntity('wd:Q277759'),
  createPublisher: createEntity('wd:Q2085381'),
  createCollection: createEntity('wd:Q20655472', {
    canHaveLabels: false,
    defaultClaims: {
      'wdt:P123': [ 'wd:Q1799264' ],
      'wdt:P1476': [ randomWords(4) ]
    }
  }),
  randomLabel: (length = 5) => randomWords(length),
  humanName,

  createEdition: async (params = {}) => {
    const { work } = params
    let { works, title, claims, publisher, publicationDate } = params
    publisher = publisher || 'wd:Q1799264'
    publicationDate = publicationDate || '2020'
    const lang = params.lang || 'en'
    if (work != null && works == null) works = [ work ]
    const worksPromise = works ? Promise.resolve(works) : API.createWork()
    works = await worksPromise
    works = _.forceArray(works)
    title = title || _.values(works[0].labels)[0]
    const worksUris = _.map(works, 'uri')
    const editionClaims = Object.assign({
      'wdt:P31': [ 'wd:Q3331189' ],
      'wdt:P629': worksUris,
      'wdt:P1476': [ title ],
      'wdt:P1680': [ randomWords() ],
      'wdt:P407': [ `wd:${wdLang.byCode[lang].wd}` ],
      'wdt:P123': [ publisher ],
      'wdt:P577': [ publicationDate ],
      'invp:P2': [ someImageHash ],
    }, claims)
    return authReq('post', '/api/entities?action=create', { claims: editionClaims })
  },

  createEditionWithIsbn: async (params = {}) => {
    const { publisher } = params
    const work = await API.createWork()
    const isbn13h = API.generateIsbn13h()
    const claims = {
      'wdt:P31': [ 'wd:Q3331189' ],
      'wdt:P629': [ work.uri ],
      'wdt:P212': [ isbn13h ],
      'wdt:P1476': [ API.randomLabel() ]
    }
    if (publisher) claims['wdt:P123'] = [ publisher ]
    const edition = await authReq('post', '/api/entities?action=create', { claims })
    edition.isbn = edition.uri.split(':')[1]
    edition.invUri = `inv:${edition._id}`
    edition.isbn13h = isbn13h
    return edition
  },

  createEditionFromWorks: (...works) => {
    const params = { works }
    return API.createEdition(params)
  },

  createWorkWithAuthor: async (human, label) => {
    label = label || API.randomLabel()
    const humanPromise = human ? Promise.resolve(human) : API.createHuman()

    human = await humanPromise
    return authReq('post', '/api/entities?action=create', {
      labels: { en: label },
      claims: {
        'wdt:P31': [ 'wd:Q47461344' ],
        'wdt:P50': [ human.uri ]
      }
    })
  },

  createWorkWithSerie: async serie => {
    const work = await API.createWork()
    await API.addSerie(work, serie)
    // Get a refreshed version of the work
    return getByUri(work.uri)
  },

  createWorkWithAuthorAndSerie: async () => {
    const work = await API.createWorkWithAuthor()
    await API.addSerie(work)
    // Get a refreshed version of the work
    return getByUri(work.uri)
  },

  createEditionWithWorkAndAuthor: async () => {
    const work = await API.createWorkWithAuthor()
    return API.createEdition({ work })
  },

  createEditionWithWorkAuthorAndSerie: async () => {
    const work = await API.createWorkWithAuthorAndSerie()
    return API.createEdition({ work })
  },

  createItemFromEntityUri: (uri, data = {}) => {
    return authReq('post', '/api/items', Object.assign({}, data, { entity: uri }))
  },

  someFakeUri: 'inv:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',

  someImageHash,

  someOpenLibraryId: (type = 'human') => {
    const numbers = Math.random().toString().slice(2, 7)
    const typeLetter = openLibraryTypeLetters[type]
    return `OL1${numbers}${typeLetter}`
  },

  someGoodReadsId: () => {
    const numbers = Math.random().toString().slice(2, 7)
    return `100000000${numbers}`
  },

  someLibraryThingsWorkId: () => Math.random().toString().slice(2, 10),

  generateIsbn13: () => {
    const isbn = `9780${_.join(_.sampleSize(_.split('0123456789', ''), 9), '')}`
    if (isbn_.isValidIsbn(isbn)) return isbn
    return API.generateIsbn13()
  },

  generateIsbn13h: () => isbn_.toIsbn13h(API.generateIsbn13())
}

const addEntityClaim = (createFnName, property) => async (subjectEntity, objectEntity) => {
  const subjectUri = _.isString(subjectEntity) ? subjectEntity : subjectEntity.uri
  let objectUri, entity
  if (objectEntity) {
    objectUri = _.isString(objectEntity) ? objectEntity : objectEntity.uri
    entity = getByUri(objectUri)
  } else {
    entity = await API[createFnName]()
    objectUri = entity.uri
  }
  await addClaim(subjectUri, property, objectUri)
  return entity
}

API.addAuthor = addEntityClaim('createHuman', 'wdt:P50')
API.addSerie = addEntityClaim('createSerie', 'wdt:P179')
API.addPublisher = addEntityClaim('createPublisher', 'wdt:P123')
API.addTranslator = addEntityClaim('createHuman', 'wdt:P655')

const openLibraryTypeLetters = {
  edition: 'M',
  work: 'W',
  human: 'A'
}
