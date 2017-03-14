CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ nonAuthReq, authReq } = __.require 'apiTests', 'utils/utils'

describe 'entities:create', ->
  it 'should create an entity', (done)->
    authReq 'post', '/api/entities?action=create',
      labels: { fr: 'bla' }
      claims: { 'wdt:P31': [ 'wd:Q571' ] }
    .then (res)->
      res._id.should.be.a.String()
      res._rev.should.be.a.String()
      done()
    .catch _.Error('entities create')

    return

  it 'should reject an entity with several values for a property that take one', (done)->
    authReq 'post', '/api/entities?action=create',
      labels: { fr: 'bla' }
      claims: { 'wdt:P31': [ 'wd:Q571', 'wd:Q572' ] }
    .catch (err)->
      err.statusCode.should.equal 400
      err.body.status_verbose.match(/expects a unique value/).should.be.ok()
      done()

    return

  it 'should reject invalid property', (done)->
    authReq 'post', '/api/entities?action=create',
      labels: { fr: 'bla' }
      # 'wd:P31' isn't a valid property URI
      claims: { 'wd:P31': [ 'wd:Q571' ] }
    .then (res)->
      console.log('res', res)
    .catch (err)->
      err.body.status_verbose.should.equal 'invalid property'
      err.statusCode.should.equal 400
      done()

    return

  it 'should reject invalid property value', (done)->
    authReq 'post', '/api/entities?action=create',
      labels: { fr: 'bla' }
      # 'wd:P31' isn't a valid entity URI
      claims: { 'wdt:P31': [ 'wd31' ] }
    .then (res)->
      console.log('res', res)
    .catch (err)->
      err.body.status_verbose.should.equal 'invalid property value'
      err.statusCode.should.equal 400
      done()

    return

  it 'should reject an entity created with a concurrent property with a value already taken', (done)->
    # Make the entity being scaffolded from seed
    nonAuthReq 'get', '/api/entities?action=by-uris&uris=isbn:9782253138938'
    .then (res)->
      authReq 'post', '/api/entities?action=create',
        labels: { fr: 'bla' }
        claims: { 'wdt:P212': [ '978-2-253-13893-8' ] }
      .catch (err)->
        err.body.status_verbose.should.equal 'this property value is already used'
        err.statusCode.should.equal 400
        done()

    return
