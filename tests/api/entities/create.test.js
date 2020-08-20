require('should')
const { authReq, undesiredRes, shouldNotBeCalled } = require('../utils/utils')
const { createEditionWithIsbn, humanName, randomLabel, someOpenLibraryId } = require('../fixtures/entities')
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
    .catch(done)
  })

  it('should reject invalid claims', done => {
    authReq('post', endpoint, { claims: 'foo' })
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid claims')
      err.statusCode.should.equal(400)
      done()
    })
    .catch(done)
  })

  it('should reject entities of unknown entity types', async () => {
    try {
      await authReq('post', '/api/entities?action=create', {
        labels: {},
        claims: { 'wdt:P31': [ 'wd:Q1' ] }
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal("wdt:P31 value isn't a known value")
    }
  })

  it('should reject entities of non-whitelisted entity types', async () => {
    try {
      await authReq('post', '/api/entities?action=create', {
        labels: {
          en: randomLabel()
        },
        // Is in server/lib/wikidata/aliases.js, but gives a type 'movement'
        claims: { 'wdt:P31': [ 'wd:Q2198855' ] }
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal("wdt:P31 value isn't a whitelisted value")
    }
  })

  it('should reject without a label (unless specific types)', done => {
    authReq('post', endpoint, {
      claims: { 'wdt:P31': [ 'wd:Q47461344' ] }
    })
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('invalid labels')
      done()
    })
    .catch(done)
  })

  it('should create a work entity', done => {
    authReq('post', endpoint, {
      labels: { fr: humanName() },
      claims: { 'wdt:P31': [ 'wd:Q47461344' ] }
    })
    .then(res => {
      res._id.should.be.a.String()
      res._rev.should.be.a.String()
      res.type.should.equal('work')
      res.claims.should.deepEqual({ 'wdt:P31': [ 'wd:Q47461344' ] })
      res.uri.should.be.a.String()
      res.labels.should.be.an.Object()
      done()
    })
    .catch(done)
  })

  it('should create claim with a type specific validation', done => {
    authReq('post', endpoint, {
      labels: { fr: humanName() },
      claims: {
        'wdt:P31': [ 'wd:Q47461344' ],
        'wdt:P648': [ someOpenLibraryId('work') ]
      }
    })
    .then(res => {
      res._id.should.be.a.String()
      done()
    })
    .catch(done)
  })

  it('should reject multiple values for a property that take one', done => {
    authReq('post', endpoint, {
      labels: { fr: humanName() },
      claims: { 'wdt:P31': [ 'wd:Q47461344', 'wd:Q572' ] }
    })
    .then(undesiredRes(done))
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.match(/expects a unique value/).should.be.ok()
      done()
    })
    .catch(done)
  })

  it('should reject invalid labels datatype', done => {
    authReq('post', endpoint, {
      labels: [],
      claims: {}
    })
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid labels')
      err.statusCode.should.equal(400)
      done()
    })
    .catch(done)
  })

  it('should reject invalid claims datatype', done => {
    authReq('post', endpoint, {
      labels: {},
      claims: []
    })
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid claims')
      err.statusCode.should.equal(400)
      done()
    })
    .catch(done)
  })

  it('should reject invalid claim property values', done => {
    authReq('post', endpoint, {
      labels: { fr: humanName() },
      claims: {
        'wdt:P31': [ 'wd:Q47461344' ],
        'wdt:P50': 'wd:Q535'
      }
    })
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('invalid property values')
      err.statusCode.should.equal(400)
      done()
    })
    .catch(done)
  })

  it('should reject invalid prefix properties', done => {
    authReq('post', endpoint, {
      labels: { fr: humanName() },
      claims: {
        'wdt:P31': [ 'wd:Q47461344' ],
        'wd:P50': [ 'wd:Q535' ]
      }
    })
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('invalid property')
      err.statusCode.should.equal(400)
      done()
    })
    .catch(done)
  })

  it('should reject invalid claim property value', done => {
    authReq('post', endpoint, {
      labels: { fr: humanName() },
      claims: {
        'wdt:P31': [ 'wd:Q47461344' ],
        'wdt:P50': [ 'wd####Q535' ]
      }
    })
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('invalid property value')
      err.statusCode.should.equal(400)
      done()
    })
    .catch(done)
  })

  it('should reject when concurrent property value is already taken', async () => {
    const edition = await createEditionWithIsbn()
    try {
      await authReq('post', endpoint, {
        claims: {
          'wdt:P31': [ 'wd:Q3331189' ],
          'wdt:P1476': [ randomLabel() ],
          'wdt:P629': edition.claims['wdt:P629'],
          // The concurrent property
          'wdt:P212': edition.claims['wdt:P212']
        }
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      err.body.status_verbose.should.equal('this property value is already used')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject creation with incorrect properties', done => {
    authReq('post', endpoint, {
      labels: { fr: randomLabel() },
      claims: {
        'wdt:P31': [ 'wd:Q47461344' ], // work
        'wdt:P1104': [ 124 ] // edition pages counts
      }
    })
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal("works can't have a property wdt:P1104")
      err.statusCode.should.equal(400)
      done()
    })
    .catch(done)
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
    .catch(done)
  })

  it('should create wikidata entities', done => {
    authReq('post', endpoint, {
      prefix: 'wd',
      labels: { fr: humanName() },
      claims: {
        'wdt:P31': [ 'wd:Q47461344' ],
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
    .catch(done)
  })
})

// See also: editions/create.test.js
