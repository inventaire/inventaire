const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { customAuthReq, authReq, getUser } = require('../utils/utils')
const { Promise } = __.require('lib', 'promises')
const isbn_ = __.require('lib', 'isbn/isbn')
const wdLang = require('wikidata-lang')
const { getByUri, getByUris, addClaim } = require('../utils/entities')
const faker = require('faker')
const someImageHash = '00015893d54f5112b99b41b0dfd851f381798047'

const defaultEditionData = () => ({
  labels: {},
  claims: {
    'wdt:P31': [ 'wd:Q3331189' ],
    'wdt:P1476': [ API.randomLabel() ]
  }
})

const createEntity = P31 => (params = {}) => {
  const defaultLabel = P31 === 'wd:Q5' ? humanName() : API.randomLabel(4)
  const labels = params.labels || { en: defaultLabel }
  const user = params.user || getUser()
  return customAuthReq(user, 'post', '/api/entities?action=create', {
    labels,
    claims: { 'wdt:P31': [ P31 ] }
  })
}

const humanName = () => faker.fake('{{name.firstName}} {{name.lastName}}')
const randomWords = length => faker.random.words(length)

const API = module.exports = {
  createHuman: createEntity('wd:Q5'),
  createWork: createEntity('wd:Q571'),
  createSerie: createEntity('wd:Q277759'),
  createPublisher: createEntity('wd:Q2085381'),
  randomLabel: (length = 5) => randomWords(length),
  humanName,
  createWorkWithAuthor: (human, label) => {
    const humanPromise = human ? Promise.resolve(human) : API.createHuman()
    if (!label) { label = API.randomLabel() }

    return humanPromise
    .then(human => {
      return authReq('post', '/api/entities?action=create', {
        labels: { en: label },
        claims: {
          'wdt:P31': [ 'wd:Q571' ],
          'wdt:P50': [ human.uri ]
        }
      })
    })
  },

  createEdition: (params = {}) => {
    const { work } = params
    let { works } = params
    const lang = params.lang || 'en'
    if (work != null && works == null) works = [ work ]
    const worksPromise = works ? Promise.resolve(works) : API.createWork()

    return worksPromise
    .then(works => {
      works = _.forceArray(works)
      const worksUris = _.map(works, 'uri')
      return authReq('post', '/api/entities?action=create', {
        claims: {
          'wdt:P31': [ 'wd:Q3331189' ],
          'wdt:P629': worksUris,
          'wdt:P1476': [ _.values(works[0].labels)[0] ],
          'wdt:P1680': [ randomWords() ],
          'wdt:P407': [ `wd:${wdLang.byCode[lang].wd}` ],
          'invp:P2': [ someImageHash ]
        }
      })
    })
  },

  createEditionFromWorks: (...works) => {
    const params = { works }
    return API.createEdition(params)
  },

  createWorkWithAuthorAndSerie: () => {
    return API.createWorkWithAuthor()
    .tap(API.addSerie)
    // Get a refreshed version of the work
    .then(work => getByUri(work.uri))
  },

  createEditionWithWorkAuthorAndSerie: () => {
    return API.createWorkWithAuthorAndSerie()
    .then(work => API.createEdition({ work }))
  },

  createItemFromEntityUri: (uri, data = {}) => {
    return authReq('post', '/api/items', Object.assign({}, data, { entity: uri }))
  },

  ensureEditionExists: (uri, workData, editionData) => {
    return getByUris(uri)
    .get('entities')
    .then(entities => {
      if (entities[uri]) return entities[uri]
      if (!workData) {
        workData = {
          labels: { fr: API.randomLabel() },
          claims: { 'wdt:P31': [ 'wd:Q571' ] }
        }
      }
      return authReq('post', '/api/entities?action=create', {
        labels: { de: humanName() },
        claims: { 'wdt:P31': [ 'wd:Q5' ] }
      })
      .then(authorEntity => {
        workData.claims['wdt:P50'] = [ authorEntity.uri ]
        return authReq('post', '/api/entities?action=create', workData)
      })
      .then(workEntity => {
        if (!editionData) { editionData = defaultEditionData() }
        const id = uri.split(':')[1]
        if (isbn_.isValidIsbn(id)) {
          editionData.claims['wdt:P212'] = [ isbn_.toIsbn13h(id) ]
        }
        editionData.claims['wdt:P629'] = [ workEntity.uri ]
        return authReq('post', '/api/entities?action=create', editionData)
      })
    })
  },

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

  generateIsbn13: () => {
    const isbn = `9780${_.join(_.sampleSize(_.split('0123456789', ''), 9), '')}`
    if (isbn_.isValidIsbn(isbn)) return isbn
    return API.generateIsbn13()
  }
}

const addEntityClaim = (createFnName, property) => subjectEntity => {
  const subjectUri = _.isString(subjectEntity) ? subjectEntity : subjectEntity.uri
  return API[createFnName]()
  .tap(entity => addClaim(subjectUri, property, entity.uri))
}

API.addAuthor = addEntityClaim('createHuman', 'wdt:P50')
API.addSerie = addEntityClaim('createSerie', 'wdt:P179')

const openLibraryTypeLetters = {
  edition: 'M',
  work: 'W',
  human: 'A'
}
