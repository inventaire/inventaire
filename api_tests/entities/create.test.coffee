CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ nonAuthReq, authReq, undesiredRes, undesiredErr } = __.require 'apiTests', 'utils/utils'
{ ensureEditionExists } = require './helpers'

describe 'entities:create', ->
  it 'should not be able to create an entity without a wdt:P31 value', (done)->
    authReq 'post', '/api/entities?action=create',
      labels: { de: 'moin moin' }
      claims: { 'wdt:P50': [ 'wd:Q535' ] }
    .catch (err)->
      err.body.status_verbose.should.equal "wdt:P31 array can't be empty"
      done()
    .catch undesiredErr(done)

    return

  it 'should not be able to create an entity without a label (unless specific types)', (done)->
    authReq 'post', '/api/entities?action=create',
      labels: {}
      claims: { 'wdt:P31': [ 'wd:Q571' ] }
    .catch (err)->
      err.body.status_verbose.should.equal 'invalid labels'
      done()
    .catch undesiredErr(done)

    return

  it 'should not be able to create an entity without a known valid wdt:P31 value', (done)->
    authReq 'post', '/api/entities?action=create',
      labels: { de: 'moin moin' }
      claims: { 'wdt:P31': [ 'wd:Q535' ] }
    .catch (err)->
      err.body.status_verbose.should.equal "wdt:P31 value isn't a known valid value"
      done()
    .catch undesiredErr(done)

    return

  it 'should create an entity', (done)->
    authReq 'post', '/api/entities?action=create',
      labels: { fr: 'bla' }
      claims: { 'wdt:P31': [ 'wd:Q571' ] }
    .then (res)->
      res._id.should.be.a.String()
      res._rev.should.be.a.String()
      done()
    .catch undesiredErr(done)

    return

  it 'should reject an entity with several values for a property that take one', (done)->
    authReq 'post', '/api/entities?action=create',
      labels: { fr: 'bla' }
      claims: { 'wdt:P31': [ 'wd:Q571', 'wd:Q572' ] }
    .catch (err)->
      err.statusCode.should.equal 400
      err.body.status_verbose.match(/expects a unique value/).should.be.ok()
      done()
    .catch undesiredErr(done)

    return

  it 'should reject invalid labels object', (done)->
    authReq 'post', '/api/entities?action=create',
      # Invalid labels type: array instead of object
      labels: [ { fr: 'bla' } ]
      claims: { 'wdt:P31': [ 'wd:Q571' ] }
    .catch (err)->
      err.body.status_verbose.should.equal 'labels should be an object'
      err.statusCode.should.equal 400
      done()
    .catch undesiredErr(done)

    return

  it 'should reject invalid claims object', (done)->
    authReq 'post', '/api/entities?action=create',
      labels: { fr: 'bla' }
      # Invalid claims type: array instead of object
      claims: [ { 'wdt:P31': [ 'wd:Q571' ] } ]
    .catch (err)->
      err.body.status_verbose.should.equal 'claims should be an object'
      err.statusCode.should.equal 400
      done()
    .catch undesiredErr(done)

    return

  it 'should reject invalid property array', (done)->
    authReq 'post', '/api/entities?action=create',
      labels: { fr: 'bla' }
      claims:
        'wdt:P31': [ 'wd:Q571' ]
        'wdt:P50': 'wd:Q535'
    .catch (err)->
      err.body.status_verbose.should.equal 'invalid property array'
      err.statusCode.should.equal 400
      done()
    .catch undesiredErr(done)

    return

  it 'should reject invalid property', (done)->
    authReq 'post', '/api/entities?action=create',
      labels: { fr: 'bla' }
      claims:
        'wdt:P31': [ 'wd:Q571' ]
        # 'wd:P50' isn't a valid property URI
        'wd:P50': [ 'wd:Q535' ]
    .catch (err)->
      err.body.status_verbose.should.equal 'invalid property'
      err.statusCode.should.equal 400
      done()
    .catch undesiredErr(done)

    return

  it 'should reject invalid property value', (done)->
    authReq 'post', '/api/entities?action=create',
      labels: { fr: 'bla' }
      # 'wd:P31' isn't a valid entity URI
      claims:
        'wdt:P31': [ 'wd:Q571' ]
        'wdt:P50': [ 'wdQ535' ]
    .catch (err)->
      err.body.status_verbose.should.equal 'invalid property value'
      err.statusCode.should.equal 400
      done()
    .catch undesiredErr(done)

    return

  it 'should reject an entity created with a concurrent property with a value already taken', (done)->
    ensureEditionExists 'isbn:9782315006113', null,
      claims:
        'wdt:P31': [ 'wd:Q3331189' ]
        'wdt:P212': [ '978-2-315-00611-3' ]
        'wdt:P1476': [ 'bla' ]
    .then (editionEntity)->
      authReq 'post', '/api/entities?action=create',
        claims:
          'wdt:P31': [ 'wd:Q3331189' ]
          'wdt:P212': [ '978-2-315-00611-3' ]
          'wdt:P1476': [ 'bla' ]
          'wdt:P629': editionEntity.claims['wdt:P629']
    .catch (err)->
      err.body.status_verbose.should.equal 'this property value is already used'
      err.statusCode.should.equal 400
      done()
    .catch undesiredErr(done)

    return

  it 'should reject an entity created with inappropriate properties', (done)->
    authReq 'post', '/api/entities?action=create',
      labels: { fr: 'bla' }
      claims:
        'wdt:P31': [ 'wd:Q571' ]
        # A work entity should not have pages counts
        'wdt:P1104': [ 124 ]
    .then undesiredRes(done)
    .catch (err)->
      err.body.status_verbose.should.equal "works can't have a property wdt:P1104"
      err.statusCode.should.equal 400
      done()
    .catch undesiredErr(done)

    return

  # See also: edititons/create.test.coffee
