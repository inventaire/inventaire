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

  it 'should add a warning for unknown parameter', (done)->
    req = { query: { foo: 1000 } }
    res = {}
    configs = {}
    sanitize req, res, configs
    .then (input)->
      input.should.deepEqual {}
      res.warnings.should.be.an.Object()
      res.warnings.parameters.should.deepEqual [
        'unexpected parameter: foo'
      ]
      done()
    .catch done

    return

  it 'should add a warning for unexpected parameter', (done)->
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
          'limit should be below or equal to 500'
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

    it 'should reject non integer values', (done)->
      req = { query: { limit: '5.5' } }
      configs = { limit: {} }
      sanitize req, {}, configs
      .then undesiredRes(done)
      .catch (err)->
        err.message.should.equal 'invalid limit: 5.5'
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
      done()

    it 'should accept valid uuids', (done)->
      req = { query: { user: '00000000000000000000000000000000' } }
      configs = { user: {} }
      sanitize req, {}, configs
      .then (input)->
        input.user.should.equal '00000000000000000000000000000000'
        done()
      .catch done

      return
