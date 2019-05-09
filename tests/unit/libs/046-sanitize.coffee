CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
sanitize = __.require 'lib', 'sanitize/sanitize'
{ undesiredRes } = require '../utils'

describe 'sanitize', ->
  it 'should be a function', (done)->
    sanitize.should.be.a.Function()
    done()

  it 'should return a promise', (done)->
    sanitize().catch (err)-> done()
    return

  it 'should reject invalid req objects based on req.query existance', (done)->
    req = {}
    configs = {}
    sanitize req, {}, configs
    .catch (err)->
      err.message.should.startWith 'TypeError: expected object, got undefined'
      done()
    .catch done

    return

  it 'should add a warning for unknown parameter (server error)', (done)->
    req = { query: { foo: 1000 } }
    res = {}
    configs = {
      foo: {}
    }
    sanitize req, res, configs
    .then (input)->
      input.should.deepEqual {}
      res.warnings.should.be.an.Object()
      res.warnings.parameters.should.deepEqual [
        'unexpected config parameter: foo'
      ]
      done()
    .catch done

    return

  it 'should add a warning for unexpected parameter (user error)', (done)->
    req = { query: { limit: 1000 } }
    res = {}
    configs = {}
    sanitize req, res, configs
    .then (input)->
      input.should.deepEqual {}
      res.warnings.should.be.an.Object()
      res.warnings.parameters.should.deepEqual [
        'unexpected parameter: limit'
      ]
      done()
    .catch done

    return

  describe 'optional parameters', ->
    it 'should accept optional parameters', (done)->
      req = { query: {} }
      res = {}
      configs =
        ids: { optional: true }
      sanitize req, res, configs
      .then (input)->
        Object.keys(input).length.should.equal 0
        done()
      .catch done

      return

    it 'should still validate optional parameters', (done)->
      req = { query: { lang: '1212515' } }
      res = {}
      configs = { lang: { optional: true } }
      sanitize req, res, configs
      .then undesiredRes(done)
      .catch (err)->
        err.message.should.equal 'invalid lang: 1212515'
        done()
      .catch done

      return

  describe 'secret parameter', ->
    it 'should not return the value', (done)->
      req = { query: { password: 'a' } }
      configs = { password: {} }
      sanitize req, {}, configs
      .then undesiredRes(done)
      .catch (err)->
        err.context.value.should.equal '*'
        done()
      .catch done

      return

  describe 'generic parameter', ->
    it 'should accept generic parameters', (done)->
      req = { query: { 'include-users': true } }
      res = {}

      configs =
        'include-users':
          generic: 'boolean'
          default: false

      sanitize req, res, configs
      .then (input)->
        input.includeUsers.should.equal true
        done()
      .catch done

      return

  describe 'strictly positive integer', ->
    it 'should accept string values', (done)->
      req = { query: { limit: '5' } }
      configs = { limit: {} }
      sanitize req, {}, configs
      .then (input)->
        input.limit.should.equal 5
        done()
      .catch done

      return

    it 'should accept a default value', (done)->
      req = { query: {} }
      configs = { limit: { default: 100 } }
      sanitize req, {}, configs
      .then (input)->
        input.limit.should.equal 100
        done()
      .catch done

      return

    it 'should accept a max value', (done)->
      req = { query: { limit: 1000 } }
      res = {}
      configs = { limit: { max: 500 } }
      sanitize req, res, configs
      .then (input)->
        input.limit.should.equal 500
        res.warnings.should.be.an.Object()
        res.warnings.parameters.should.deepEqual [
          "limit can't be over 500"
        ]
        done()
      .catch done

      return

    it 'should reject negative values', (done)->
      req = { query: { limit: '-5' } }
      configs = { limit: {} }
      sanitize req, {}, configs
      .then undesiredRes(done)
      .catch (err)->
        err.message.should.equal 'invalid limit: -5'
        done()
      .catch done

      return

    it 'should reject non-integer values', (done)->
      req = { query: { limit: '5.5' } }
      configs = { limit: {} }
      sanitize req, {}, configs
      .then undesiredRes(done)
      .catch (err)->
        err.message.should.equal 'invalid limit: 5.5'
        done()
      .catch done

      return

    it 'should reject non-number values', (done)->
      req = { query: { limit: 'bla' } }
      configs = { limit: {} }
      sanitize req, {}, configs
      .then undesiredRes(done)
      .catch (err)->
        err.message.should.equal 'invalid limit: bla'
        done()
      .catch done

      return

  describe 'couch uuid', ->
    it 'should reject invalid uuids values', (done)->
      req = { query: { user: 'foo' } }
      configs = { user: {} }
      sanitize req, {}, configs
      .then undesiredRes(done)
      .catch (err)->
        err.message.should.equal 'invalid user: foo'
        done()
      .catch done

      return

    it 'should accept valid uuids', (done)->
      req = { query: { user: '00000000000000000000000000000000' } }
      configs = { user: {} }
      sanitize req, {}, configs
      .then (input)->
        input.user.should.equal '00000000000000000000000000000000'
        input.userId.should.equal '00000000000000000000000000000000'
        done()
      .catch done

      return

  describe 'string with specific length', ->
    it 'should reject a token of invalid type', (done)->
      req = { query: { token: 1251251 } }
      configs = { token: { length: 32 } }
      sanitize req, {}, configs
      .then undesiredRes(done)
      .catch (err)->
        err.message.should.equal 'invalid token: expected string, got number'
        done()
      .catch done

      return

    it 'should reject an invalid token', (done)->
      req = { query: { token: 'foo' } }
      configs = { token: { length: 32 } }
      sanitize req, {}, configs
      .then undesiredRes(done)
      .catch (err)->
        err.message.should.equal 'invalid token length: expected 32, got 3'
        done()
      .catch done

      return

  describe 'uris', ->
    it 'should reject invalid type', (done)->
      req = { query: { uris: 1251251 } }
      configs = { uris: {} }
      sanitize req, {}, configs
      .then undesiredRes(done)
      .catch (err)->
        err.message.should.equal 'invalid uris: expected array, got number'
        done()
      .catch done

      return

    it 'should reject array including invalid values', (done)->
      req = { query: { uris: [ 1251251 ] } }
      configs = { uris: {} }
      sanitize req, {}, configs
      .then undesiredRes(done)
      .catch (err)->
        err.message.should.startWith 'invalid uri: expected uri, got'
        done()
      .catch done

      return

    it 'should accept uris as an array of strings', (done)->
      req = { query: { uris: [ 'wd:Q535', 'isbn:9782330056315' ] } }
      configs = { uris: {} }
      sanitize req, {}, configs
      .then (input)->
        input.uris.should.deepEqual req.query.uris
        done()
      .catch done

      return

    it 'should accept uris as a pipe separated string', (done)->
      req = { query: { uris: 'wd:Q535|isbn:9782330056315' } }
      configs = { uris: {} }
      sanitize req, {}, configs
      .then (input)->
        input.uris.should.deepEqual req.query.uris.split('|')
        done()
      .catch done

      return

  describe 'uri', ->
    it 'should reject invalid type', (done)->
      req = { query: { uri: 1251251 } }
      configs = { uri: {} }
      sanitize req, {}, configs
      .then undesiredRes(done)
      .catch (err)->
        err.message.should.startWith 'invalid uri'
        done()
      .catch done

      return

  describe 'ids', ->
    it 'should reject invalid type', (done)->
      req = { query: { ids: 1251251 } }
      configs = { ids: {} }
      sanitize req, {}, configs
      .then undesiredRes(done)
      .catch (err)->
        err.message.should.equal 'invalid ids: expected array, got number'
        done()
      .catch done

      return

    it 'should reject array including invalid values', (done)->
      req = { query: { ids: [ 1251251 ] } }
      configs = { ids: {} }
      sanitize req, {}, configs
      .then undesiredRes(done)
      .catch (err)->
        err.message.should.startWith 'invalid id: expected id, got'
        done()
      .catch done

      return

    it 'should deduplicate ids', (done)->
      id = '5ac0fc497813d9817047e0b89301e502'
      req = { query: { ids: [ id, id ] } }
      configs = { ids: {} }
      sanitize req, {}, configs
      .then (input)->
        input.ids.should.deepEqual [ id ]
        done()
      .catch done

      return

    it 'should reject an empty array', (done)->
      req = { query: { ids: [] } }
      configs = { ids: {} }
      sanitize req, {}, configs
      .then undesiredRes(done)
      .catch (err)->
        err.message.should.startWith "ids array can't be empty"
        done()
      .catch done

      return

  describe 'lang', ->
    it "should default to 'en'", (done)->
      req = { query: {} }
      res = {}
      configs = { lang: {} }
      sanitize req, res, configs
      .then (input)->
        input.lang.should.equal 'en'
        done()
      .catch done

      return

    it 'should accept a valid lang', (done)->
      req = { query: { lang: 'fr' } }
      res = {}
      configs = { lang: {} }
      sanitize req, res, configs
      .then (input)->
        input.lang.should.equal 'fr'
        done()
      .catch done

      return

    it 'should reject an invalid lang', (done)->
      req = { query: { lang: '12512' } }
      res = {}
      configs = { lang: {} }
      sanitize req, res, configs
      .then undesiredRes(done)
      .catch (err)->
        err.message.should.equal 'invalid lang: 12512'
        done()
      .catch done

      return

  describe 'relatives', ->
    it 'should reject non whitelisted relatives', (done)->
      req = { query: { relatives: [ 'bar', 'foo' ] } }
      res = {}
      configs = { relatives: { whitelist: [ 'bar' ] } }
      sanitize req, res, configs
      .catch (err)->
        err.message.should.startWith 'invalid relative'
        done()
      .catch done

      return

    it 'should return relatives if whitelisted', (done)->
      req = { query: { relatives: [ 'bar', 'foo' ] } }
      res = {}
      configs = { relatives: { whitelist: [ 'foo', 'bar' ] } }
      sanitize req, res, configs
      .then (input)->
        input.relatives.should.deepEqual [ 'bar', 'foo' ]
        done()
      .catch done

      return
