__ = require('config').universalPath
_ = __.require 'builders', 'utils'

should = require 'should'

describe 'utils', ->
  describe 'env', ->
    it 'should have shared utils, loggers, types, tests and misc utils', (done)->
      _.type.should.be.a.Function()
      _.types.should.be.a.Function()
      _.isLocalImg.should.be.a.Function()
      _.isNonEmptyString.should.be.a.Function()
      done()

  describe 'hashCode', ->
    it 'should return a hash', (done)->
      _.hashCode('whatever').should.be.a.Number()
      done()

  describe 'flattenIndexes', ->
    it 'should return the collection of indexes merged into one', (done)->
      _.flattenIndexes.should.be.a.Function()
      indexes = [ { a: 1 }, { b: 2 }, { c: 3 }, { a: 4, d: 5 } ]
      result = _.flattenIndexes indexes
      result.should.be.an.Object()
      result.a.should.equal 4
      result.b.should.equal 2
      result.c.should.equal 3
      result.d.should.equal 5
      Object.keys(result).length.should.equal 4
      done()

    it 'should return a new index without modifiy the passed indexes', (done)->
      indexA = { a: 1 }
      indexB = { b: 2 }
      indexC = { c: 3 }
      indexD = { a: 4, d: 5 }
      indexes = [ indexA, indexB, indexC, indexD ]
      result = _.flattenIndexes indexes
      result.should.not.equal indexA
      result.should.not.equal indexB
      result.should.not.equal indexC
      result.should.not.equal indexD
      done()
