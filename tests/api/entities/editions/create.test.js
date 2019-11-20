require('should')
const { authReq, undesiredErr, undesiredRes } = require('../../utils/utils')
const { createWork, createSerie, randomLabel } = require('../../fixtures/entities')
const workEntityPromise = createWork()

describe('entities:editions:create', () => {
  it('should not be able to create an edition entity without a work entity', done => {
    authReq('post', '/api/entities?action=create', {
      labels: {},
      claims: { 'wdt:P31': [ 'wd:Q3331189' ] }
    })
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('an edition should have an associated work (wdt:P629)')
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should reject an edition entity without a title', done => {
    workEntityPromise
    .then(workEntity => authReq('post', '/api/entities?action=create', {
      labels: {},
      claims: {
        'wdt:P31': [ 'wd:Q3331189' ],
        'wdt:P629': [ workEntity.uri ]
      }
    }))
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('an edition should have a title (wdt:P1476)')
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should reject an edition with a label', done => {
    workEntityPromise
    .then(workEntity => authReq('post', '/api/entities?action=create', {
      labels: { fr: randomLabel() },
      claims: {
        'wdt:P31': [ 'wd:Q3331189' ],
        'wdt:P629': [ workEntity.uri ],
        'wdt:P1476': [ randomLabel() ]
      }
    }))
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal("editions can't have labels")
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should accept an edition without a labels object', done => {
    workEntityPromise
    .then(workEntity => createEdition(workEntity.uri))
    .then(() => done())
    .catch(undesiredErr(done))
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
    .catch(undesiredErr(done))
  })
})

const createEdition = uri => authReq('post', '/api/entities?action=create', {
  claims: {
    'wdt:P31': [ 'wd:Q3331189' ],
    'wdt:P629': [ uri ],
    'wdt:P1476': [ randomLabel() ]
  }
})
