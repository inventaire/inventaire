require('should')
const { authReq, undesiredRes, undesiredErr } = require('../utils/utils')
const { ensureEditionExists, humanName, randomLabel, someOpenLibraryId } = require('../fixtures/entities')
const endpoint = '/api/entities?action=create'

describe('entities:create', () => {
  it('should reject without from claims', done => {
    authReq('post', endpoint, {})
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: claims')
      err.statusCode.should.equal(400)
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should reject invalid claims', done => {
    authReq('post', endpoint, { claims: 'foo' })
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid claims')
      err.statusCode.should.equal(400)
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should reject without wdt:P31 value claims', done => {
    authReq('post', endpoint, { claims: { 'wdt:P50': [ 'wd:Q535' ] } })
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal("wdt:P31 array can't be empty")
      err.statusCode.should.equal(400)
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should reject without valid wdt:P31 value', done => {
    authReq('post', endpoint, {
      claims: { 'wdt:P31': [ 'wd:Q535' ] }
    })
    .catch(err => {
      err.body.status_verbose.should.equal("wdt:P31 value isn't a known valid value")
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should reject without a label (unless specific types)', done => {
    authReq('post', endpoint, {
      claims: { 'wdt:P31': [ 'wd:Q571' ] }
    })
    .catch(err => {
      err.body.status_verbose.should.equal('invalid labels')
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should create a work entity', done => {
    authReq('post', endpoint, {
      labels: { fr: humanName() },
      claims: { 'wdt:P31': [ 'wd:Q571' ] }
    })
    .then(res => {
      res._id.should.be.a.String()
      res._rev.should.be.a.String()
      res.type.should.equal('work')
      res.claims.should.deepEqual({ 'wdt:P31': [ 'wd:Q571' ] })
      res.uri.should.be.a.String()
      res.labels.should.be.an.Object()
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should create claim with a type specific validation', done => {
    authReq('post', endpoint, {
      labels: { fr: humanName() },
      claims: {
        'wdt:P31': [ 'wd:Q571' ],
        'wdt:P648': [ someOpenLibraryId('work') ]
      }
    })
    .then(res => {
      res._id.should.be.a.String()
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should reject multiple values for a property that take one', done => {
    authReq('post', endpoint, {
      labels: { fr: humanName() },
      claims: { 'wdt:P31': [ 'wd:Q571', 'wd:Q572' ] }
    })
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.match(/expects a unique value/).should.be.ok()
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should reject invalid labels datatype', done => {
    authReq('post', endpoint, {
      labels: [],
      claims: {}
    })
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid labels')
      err.statusCode.should.equal(400)
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should reject invalid claims datatype', done => {
    authReq('post', endpoint, {
      labels: {},
      claims: []
    })
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid claims')
      err.statusCode.should.equal(400)
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should reject invalid claim property values', done => {
    authReq('post', endpoint, {
      labels: { fr: humanName() },
      claims: {
        'wdt:P31': [ 'wd:Q571' ],
        'wdt:P50': 'wd:Q535'
      }
    })
    .catch(err => {
      err.body.status_verbose.should.equal('invalid property values')
      err.statusCode.should.equal(400)
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should reject invalid prefix properties', done => {
    authReq('post', endpoint, {
      labels: { fr: humanName() },
      claims: {
        'wdt:P31': [ 'wd:Q571' ],
        'wd:P50': [ 'wd:Q535' ]
      }
    })
    .catch(err => {
      err.body.status_verbose.should.equal('invalid property')
      err.statusCode.should.equal(400)
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should reject invalid claim property value', done => {
    authReq('post', endpoint, {
      labels: { fr: humanName() },
      claims: {
        'wdt:P31': [ 'wd:Q571' ],
        'wdt:P50': [ 'wd####Q535' ]
      }
    })
    .catch(err => {
      err.body.status_verbose.should.equal('invalid property value')
      err.statusCode.should.equal(400)
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should reject when concurrent property value is already taken', done => {
    const editionClaims = {
      claims: {
        'wdt:P31': [ 'wd:Q3331189' ],
        'wdt:P212': [ '978-2-315-00611-3' ],
        'wdt:P1476': [ randomLabel() ]
      }
    }
    ensureEditionExists('isbn:9782315006113', null, editionClaims)
    .then(editionEntity => {
      editionClaims.claims['wdt:P629'] = editionEntity.claims['wdt:P629']
      authReq('post', endpoint, editionClaims)
      .catch(err => {
        err.body.status_verbose.should.equal('this property value is already used')
        err.statusCode.should.equal(400)
        done()
      })
    })
    .catch(undesiredErr(done))
  })

  it('should reject creation with incorrect properties', done => {
    authReq('post', endpoint, {
      labels: { fr: randomLabel() },
      claims: {
        'wdt:P31': [ 'wd:Q571' ], // work
        'wdt:P1104': [ 124 ] // edition pages counts
      }
    })
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal("works can't have a property wdt:P1104")
      err.statusCode.should.equal(400)
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should reject invalid prefixes', done => {
    authReq('post', endpoint, {
      prefix: 'foo',
      labels: {},
      claims: {}
    })
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid prefix: foo')
      err.statusCode.should.equal(400)
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should create wikidata entities', done => {
    authReq('post', endpoint, {
      prefix: 'wd',
      labels: { fr: humanName() },
      claims: {
        'wdt:P31': [ 'wd:Q571' ],
        'wdt:P648': [ someOpenLibraryId('work') ]
      }
    })
    .then(undesiredRes(done))
    .catch(err => {
      // test oauth request sending by throwing error
      // as test env cannot have any wd tokens
      err.body.status_verbose.should.equal('missing wikidata oauth tokens')
      err.statusCode.should.equal(400)
      done()
    })
    .catch(undesiredErr(done))
  })
})

// See also: editions/create.test.js
