__ = require('config').root
_ = __.require 'builders', 'utils'

should = require 'should'
expect = require('chai').expect
trycatch = require 'trycatch'
sinon = require 'sinon'

testDbName = 'tests'
graph = __.require('graph', 'base')(testDbName)
_.logYellow graph, 'graph'

aliasedTriple =
  s: 'A'
  p: 'C'
  o: 'B'
  other: 'whatever'

aliasedTriples = []
[1..3].forEach (i)->
  triple = _.clone aliasedTriple
  triple.i = i
  aliasedTriples.push triple

aliases = graph.aliases
aliasesKeys = graph.aliasesKeys
_.logYellow aliases, 'aliases'
_.logYellow aliasesKeys, 'aliasesKeys'

queries = []
aliasesKeys.forEach (alias)->
  query = _.omit(aliasedTriple, [alias, 'other'])
  aliasesKeys.forEach (alias)->
    queries.push _.omit(query, alias)


Fake = ->
  @queries = queries
  @triple = _.clone aliasedTriple
  @triples = _.clone aliasedTriples
  return

_.logBlue new Fake, 'fake'

fake = {}
P = promises = {}


describe 'ALIASES', ->
  describe 'replaceAlias', ->

    beforeEach -> fake = new Fake

    it "should replace 's', 'p', and 'o' in triple", (done)->
      trycatch( ->
        newTriple = graph.replaceAlias(fake.triple)
        checkNewTriple(newTriple)
        done()
      , done)


    it "should replace 's', 'p', and/or 'o' in query", (done)->
      trycatch( ->
        fake.queries.forEach (query)->
          newQuery = graph.replaceAlias(query)
          newQuery.should.be.an.Object
          _.logBlue query, 'query'
          _.logGreen newQuery, 'newQuery'
          for alias,v of aliases
            if query[alias]?
              expect(newQuery[alias]).to.be.undefined
              newQuery[v].should.be.a.String
        done()
      , done)


  describe 'replaceAliases', ->
    beforeEach -> fake = new Fake
    it "should replace 's', 'p', and 'o' in triples array", (done)->
      trycatch( ->
        newTriples = graph.replaceAliases(fake.triples)
        newTriples.should.be.an.Array
        newTriples.forEach checkNewTriple
        done()
      , done)

    it "should accept a unique triple out of an array", (done)->
      trycatch( ->
        newTriple = graph.replaceAliases(fake.triple)
        checkNewTriple(newTriple)
        done()
      , done)

checkNewTriple = (newTriple)->
  newTriple.should.be.an.Object
  for alias,value of aliases
    expect(newTriple[alias]).to.be.undefined
    newTriple[value].should.be.a.String



describe 'ACTIONS', ->

  beforeEach ->

    # NB: beforeEach doesn't share context with methods!!
    # it can only alter variables shared with tests
    # ex: here, the fake and promises objects

    fake = new Fake

    P.triple = fake.triples[0]

    P.put = graph.put [P.triple]
    P.put.then ->
      P.query = _.pick P.triple, ['s']
      _.logBlue P.query, 'P.query'
      P.get = graph.get P.query
      P.get.then ->
        P.del = graph.del [P.triple]

    .catch (err)-> _.logRed err, 'err at Promises building'


  describe 'put', ->
    it 'should return undefined', (done)->
      trycatch( ->
        P.put.should.be.a.Promise
        P.put
        .then (res)->
          expect(res).to.be.undefined
          done()
        .catch (err)-> throw new Error(err)
      , done)

  describe 'get', ->
    it 'should return a list', (done)->
      trycatch( ->
        P.get.should.be.a.Promise
        P.get
        .then (res)->
          _.logYellow res, 'res'
          _.logYellow P.triple, 'P.triple'
          res.should.be.an.Array
          for k, v of P.query
            k = aliases[k] or k
            res.forEach (triple)->
              _.logYellow [k, v, triple], 'k, v, triple'
              triple[k].should.equal v
          res[0].should.be.an.Object
          done()
        .catch (err)-> throw new Error(err)
      , done)

  describe 'del', ->
    it 'should return undefined', (done)->
      trycatch( ->
        P.del.should.be.a.Promise
        P.del
        .then (res)->
          expect(res).to.be.undefined
          done()
        .catch (err)-> throw new Error(err)
      , done)


describe 'DB UTILS', ->
  describe 'inspectDb', ->
    it 'should be accessible', (done)->
      trycatch( ->
        graph.inspectDb()
        done()
      , done)