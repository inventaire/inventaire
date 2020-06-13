require('should')
const { authReq, undesiredRes, shouldNotBeCalled } = require('../../utils/utils')
const { createWork, createSerie, randomLabel, generateIsbn13h } = require('../../fixtures/entities')
const workEntityPromise = createWork()

describe('entities:editions:create', () => {
  it('should not be able to create an edition entity without a work entity', done => {
    authReq('post', '/api/entities?action=create', {
      labels: {},
      claims: { 'wdt:P31': [ 'wd:Q3331189' ] }
    })
    .then(undesiredRes(done))
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('an edition should have an associated work (wdt:P629)')
      done()
    })
    .catch(done)
  })

  it('should reject an edition entity without a title', done => {
    workEntityPromise
    .then(workEntity => {
      return authReq('post', '/api/entities?action=create', {
        labels: {},
        claims: {
          'wdt:P31': [ 'wd:Q3331189' ],
          'wdt:P629': [ workEntity.uri ]
        }
      })
    })
    .then(undesiredRes(done))
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('an edition should have a title (wdt:P1476)')
      done()
    })
    .catch(done)
  })

  it('should reject an edition without an ISBN without a publisher', async () => {
    const workEntity = await workEntityPromise
    try {
      await authReq('post', '/api/entities?action=create', {
        labels: {},
        claims: {
          'wdt:P31': [ 'wd:Q3331189' ],
          'wdt:P629': [ workEntity.uri ],
          'wdt:P1476': [ randomLabel() ]
        }
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('an edition without ISBN should have a publisher (wdt:P123)')
    }
  })

  it('should reject an edition without an ISBN without a publication date', async () => {
    const workEntity = await workEntityPromise
    try {
      await authReq('post', '/api/entities?action=create', {
        labels: {},
        claims: {
          'wdt:P31': [ 'wd:Q3331189' ],
          'wdt:P629': [ workEntity.uri ],
          'wdt:P1476': [ randomLabel() ],
          'wdt:P123': [ 'wd:Q1799264' ]
        }
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('an edition without ISBN should have a publication date (wdt:P577)')
    }
  })

  it('should reject an edition with a label', done => {
    workEntityPromise
    .then(workEntity => {
      return authReq('post', '/api/entities?action=create', {
        labels: { fr: randomLabel() },
        claims: {
          'wdt:P31': [ 'wd:Q3331189' ],
          'wdt:P629': [ workEntity.uri ],
          'wdt:P1476': [ randomLabel() ]
        }
      })
    })
    .then(undesiredRes(done))
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal("editions can't have labels")
      done()
    })
    .catch(done)
  })

  it('should accept an edition without a labels object', done => {
    workEntityPromise
    .then(workEntity => createEdition(workEntity.uri))
    .then(() => done())
    .catch(done)
  })

  it('should not be able to create an edition entity with a non-work entity', done => {
    createSerie()
    .then(serieEntity => createEdition(serieEntity.uri))
    .then(undesiredRes(done))
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('invalid claim entity type: serie')
      done()
    })
    .catch(done)
  })
})

const createEdition = uri => authReq('post', '/api/entities?action=create', {
  claims: {
    'wdt:P31': [ 'wd:Q3331189' ],
    'wdt:P629': [ uri ],
    'wdt:P1476': [ randomLabel() ],
    'wdt:P212': [ generateIsbn13h() ]
  }
})
