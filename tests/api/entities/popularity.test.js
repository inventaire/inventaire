require('should')
const { undesiredRes } = require('../utils/utils')
const { addClaim, getRefreshedPopularityByUri } = require('../utils/entities')
const { createEdition, createWork, createItemFromEntityUri, createSerie, createHuman } = require('../fixtures/entities')

describe('entities:popularity', () => {
  describe('edition', () => {
    it('should reject invalid uri', done => {
      const invalidUri = 'inv:aliduri'
      getRefreshedPopularityByUri(invalidUri)
      .then(undesiredRes(done))
      .catch(err => {
        err.body.status_verbose.should.startWith('invalid ')
        done()
      })
      .catch(done)
    })

    it('should default to 0', done => {
      createEdition()
      .then(edition => scoreShouldEqual(edition.uri, 0, done))
      .catch(done)
    })

    it('should equal the amount of instances in inventories', done => {
      createEdition()
      .then(edition => {
        const { uri } = edition
        return scoreShouldEqual(uri, 0)
        .then(() => createItemFromEntityUri(uri))
        .then(() => scoreShouldEqual(uri, 1, done))
      })
      .catch(done)
    })

    it('should count only one instance per owner', done => {
      createEdition()
      .then(edition => {
        const { uri } = edition
        return createItemFromEntityUri(uri, { details: '1' })
        .then(() => createItemFromEntityUri(uri, { details: '2' }))
        .then(() => scoreShouldEqual(uri, 1, done))
      })
      .catch(done)
    })
  })

  describe('work', () => {
    it('should default to 0', done => {
      createWork()
      .then(work => scoreShouldEqual(work.uri, 0, done))
      .catch(done)
    })

    it('should be incremented by every instances of editions', done => {
      createEdition()
      .then(edition => {
        const workUri = edition.claims['wdt:P629'][0]
        return scoreShouldEqual(workUri, 1)
        .then(createItemFromEntityUri.bind(null, edition.uri))
        .then(() => scoreShouldEqual(workUri, 2, done))
      })
      .catch(done)
    })
  })

  describe('serie', () => {
    it('should be made of the sum of its parts scores + number of parts', done => {
      createSerieWithAWorkWithAnEditionWithAnItem()
      // 1: item
      // 1: edition
      // 1: work
      .then(([ serie ]) => scoreShouldEqual(serie.uri, 3, done))
      .catch(done)
    })
  })

  describe('human', () => {
    it('should be made of the sum of its works scores + number of works and series', done => {
      createHumanWithAWorkWithAnEditionWithAnItem()
      // 1: item
      // 1: edition
      // 1: work
      // 1: serie
      .then(([ human ]) => scoreShouldEqual(human.uri, 4, done))
      .catch(done)
    })
  })
})

const scoreShouldEqual = async (uri, value, done) => {
  const score = await getRefreshedPopularityByUri(uri)
  score.should.equal(value)
  if (typeof done === 'function') done()
  return score
}

const createSerieWithAWorkWithAnEditionWithAnItem = async () => {
  const [ work, serie ] = await Promise.all([
    createWork(),
    createSerie()
  ])
  const [ edition ] = await Promise.all([
    createEdition({ work }),
    addClaim(work.uri, 'wdt:P179', serie.uri)
  ])
  const item = await createItemFromEntityUri(edition.uri, { lang: 'en' })
  return [ serie, work, edition, item ]
}

const createHumanWithAWorkWithAnEditionWithAnItem = async () => {
  const human = await createHuman()
  const [ serie, work, edition, item ] = await createSerieWithAWorkWithAnEditionWithAnItem()
  await Promise.all([
    addClaim(work.uri, 'wdt:P50', human.uri),
    addClaim(serie.uri, 'wdt:P50', human.uri)
  ])
  return [ human, serie, work, edition, item ]
}
