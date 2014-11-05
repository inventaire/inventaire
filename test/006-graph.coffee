__ = require('config').root
_ = __.require 'builders', 'utils'

should = require 'should'
expect = require('chai').expect
trycatch = require 'trycatch'
sinon = require 'sinon'

Promise = require 'bluebird'

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

_g = graph.utils
aliases = _g.aliases.list

aliasesKeys = _g.aliases.keys
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
  describe 'unwrap', ->

    beforeEach -> fake = new Fake

    it "should replace 's', 'p', and 'o' in triple", (done)->
      trycatch( ->
        newTriple = _g.aliases.unwrap(fake.triple)
        checkNewTriple(newTriple)
        done()
      , done)


    it "should replace 's', 'p', and/or 'o' in query", (done)->
      trycatch( ->
        fake.queries.forEach (query)->
          newQuery = _g.aliases.unwrap(query)
          newQuery.should.be.an.Object
          _.logBlue query, 'query'
          _.logGreen newQuery, 'newQuery'
          for alias,v of aliases
            if query[alias]?
              expect(newQuery[alias]).to.be.undefined
              newQuery[v].should.be.a.String
        done()
      , done)


  describe 'unwrapAll', ->
    beforeEach -> fake = new Fake
    it "should replace 's', 'p', and 'o' in triples array", (done)->
      trycatch( ->
        newTriples = _g.aliases.unwrapAll(fake.triples)
        newTriples.should.be.an.Array
        newTriples.forEach checkNewTriple
        done()
      , done)

    it "should accept a unique triple out of an array", (done)->
      trycatch( ->
        newTriple = _g.aliases.unwrapAll(fake.triple)
        checkNewTriple(newTriple)
        done()
      , done)

checkNewTriple = (newTriple)->
  newTriple.should.be.an.Object
  for alias,value of aliases
    expect(newTriple[alias]).to.be.undefined
    newTriple[value].should.be.a.String

describe 'UTILS', ->
  beforeEach -> fake = new Fake

  describe 'mirrorTriple', ->
    it "should replace 's' by 'o' and vis-versa", (done)->
      trycatch( ->
        triple = _g.mirrorTriple(fake.triple)
        triple.should.be.an.Object
        triple.s.should.equal fake.triple.o
        triple.p.should.equal fake.triple.p
        triple.o.should.equal fake.triple.s
        done()
      , done)

    it "should throw if the input is an unshortened triple", (done)->
      trycatch( ->
        errorMessage = 'wrong API: should be shortened'
        longForm = _g.aliases.unwrap(fake.triple)
        (-> _g.mirrorTriple(fake.triple)).should.not.throw errorMessage
        (-> _g.mirrorTriple(longForm)).should.throw errorMessage
        done()
      , done)


  describe 'isShortened', ->
    it "should return true on short triple form", (done)->
      trycatch( ->
        _g.isShortened(fake.triple).should.equal true
        done()
      , done)

    it "should return false on long triple form", (done)->
      trycatch( ->
        longForm = _g.aliases.unwrap(fake.triple)
        _g.isShortened(longForm).should.equal false
        done()
      , done)


  describe 'isTriple', ->
    it "should return true on triple", (done)->
      trycatch( ->
        _g.isTriple(fake.triple).should.equal true
        done()
      , done)

    it "should return false on incomplete triple", (done)->
      trycatch( ->
        _g.isTriple(fake.triple).should.equal true
        notTriple1 = _.omit fake.triple, 's'
        notTriple2 = _.omit fake.triple, 'o'
        notTriple3 = _.omit fake.triple, 'p'
        _g.isTriple(notTriple1).should.equal false
        _g.isTriple(notTriple2).should.equal false
        _g.isTriple(notTriple3).should.equal false
        done()
      , done)


  describe 'addMirrorTriples', ->
    it "should return true on triple", (done)->
      trycatch( ->
        triples = fake.triples
        withMirrors = _g.addMirrorTriples(triples)
        withMirrors.should.be.an.Array
        withMirrors.length.should.equal(triples.length * 2)
        # the first mirror's subject should equal
        # the first subject's object
        withMirrors[triples.length].o.should.equal triples[0].s
        withMirrors[triples.length].p.should.equal triples[0].p
        withMirrors[triples.length].s.should.equal triples[0].o
        done()
      , done)




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

      P.getBidirectional = graph.getBidirectional {s: 'B', p: 'C'}

      P.get.then ->
        P.del = graph.del [P.triple]

    .catch (err)->
      _.logRed err, 'err at Promises building'

  describe 'common', ->
    it 'should accept the spreaded interface', (done)->
      trycatch( ->
        graph.put('x', 'y', 'z')
        .then ->
          graph.get {s: 'x', p: 'y', o: 'z'}
          .then (list)->
            list.length.should.equal 1
            promises = [
              graph.get('x', 'y', 'z')
              graph.get('x', null, 'z')
              graph.get('x', 'y')
              graph.get('x', 'y', null)
              graph.get(null, 'y')
              graph.get(null, 'y', 'z')
              graph.get(null, null, 'z')
            ]
            Promise.all(promises).spread (l1, l2, l3, l4, l5, l6, l7)->
              l1.length.should.equal 1
              l2.length.should.equal 1
              l3.length.should.equal 1
              l4.length.should.equal 1
              l5.length.should.equal 1
              l6.length.should.equal 1
              l7.length.should.equal 1
              graph.del('x', 'y', 'z')
              .then ->
                graph.get('x', 'y', 'z')
                .then (list3)->
                  list3.length.should.equal 0
                  done()
        .catch (err)-> throw new Error(err)
      , done)

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
        P.get.then (res)->
          _.logYellow res, 'res'
          _.logYellow P.triple, 'P.triple'
          res.should.be.an.Array
          for k, v of P.query
            # k = aliases[k] or k
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

  describe 'getBidirectional', ->
    it 'should return a set', (done)->
      trycatch( ->
        P.getBidirectional.should.be.a.Promise
        P.getBidirectional
        .then (list)->
          list.should.be.an.Array
          list.length.should.equal 1
          list[0].should.equal 'A'
          done()
        .catch (err)-> throw new Error(err)
      , done)

    it 'should find relations starting from anywhere', (done)->
      trycatch( ->
        relation = {s: 'Sam', p:'knows', o: 'Bobby'}
        graph.put relation
        .then ->
          graph.getBidirectional {s: 'Bobby', p: 'knows'}
          .then (list)->
            list.length.should.equal 1
            list[0].should.equal 'Sam'
            done()
        .catch (err)-> throw new Error(err)
      , done)

    it 'should accept the spreaded interface', (done)->
      trycatch( ->
        graph.put('na', 'bu', 'co')
        .then ->
          promises = [
            graph.getBidirectional('na', 'bu')
            graph.getBidirectional('co', 'bu')
          ]
          Promise.all(promises)
          .spread (l1, l2, l3, l4, l5, l6, l7, l8)->
            l1.length.should.equal 1
            l2.length.should.equal 1
            l1[0].should.equal 'co'
            l2[0].should.equal 'na'
            done()
          .catch (err)-> throw new Error(err)
      , done)

    it 'should NOT accept having only a subject', (done)->
      trycatch( ->
        (-> graph.getBidirectional('bob')).should.throw
        done()
      , done)

  describe 'delBidirectional', ->
    it 'should delete relations starting from subject', (done)->
      trycatch( ->
        relation = {s: 'Sam', p:'knows', o: 'Bobby'}
        graph.put relation
        .then ->
          graph.delBidirectional relation
          .then ->
            graph.getBidirectional {s: 'Sam', p:'knows'}
            .then (list)->
              list.should.be.an.Array
              list.length.should.equal 0
              done()
        .catch (err)-> throw new Error(err)
      , done)

    it 'should delete relations starting from object', (done)->
      trycatch( ->
        relation = {s: 'Sam', p:'knows', o: 'Bobby'}
        mirror = _g.mirrorTriple(relation)
        graph.put relation
        .then ->
          graph.delBidirectional mirror
          .then ->
            graph.getBidirectional {s: 'Sam', p:'knows'}
            .then (list)->
              list.should.be.an.Array
              list.length.should.equal 0
              done()
        .catch (err)-> throw new Error(err)
      , done)

    it 'should accept the spreaded interface', (done)->
      trycatch( ->
        graph.put('do', 're', 'mi')
        .then ->
          graph.delBidirectional('mi', 're', 'do')
          .then ->
            graph.getBidirectional('mi', 're')
            .then (list)->
              list.should.be.an.Array
              list.length.should.equal 0
              done()
        .catch (err)-> throw new Error(err)
      , done)



describe 'DB UTILS', ->
  describe 'logDb', ->
    it 'should be accessible', (done)->
      trycatch( ->
        graph.logDb()
        done()
      , done)

  describe 'normalizeInterface', ->
    it 'should normalize the spreaded interface', (done)->
      trycatch( ->
        obj = _g.normalizeInterface(['a', 'b', 'c'])
        obj.should.be.an.Object
        obj.s.should.equal 'a'
        obj.p.should.equal 'b'
        obj.o.should.equal 'c'
        done()
      , done)

    it 'should unwrap when asked', (done)->
      trycatch( ->
        obj = _g.normalizeInterface(['a', 'b', 'c'])
        obj.should.be.an.Object
        obj.s.should.equal 'a'
        obj.p.should.equal 'b'
        obj.o.should.equal 'c'
        done()
      , done)