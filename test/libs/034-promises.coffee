__ = require('config').universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
expect = require('chai').expect

promises_ = __.require 'lib', 'promises'

describe 'promises_', ->
  describe 'settle', ->
    promises = []
    promises.push promises_.resolve('hello')
    promises.push promises_.resolve('salut')
    promises.push promises_.reject(new Error('goodbye'))
    p = promises_.settle promises
    it "should return one promise", (done)->
      p.should.be.an.Object()
      p.then.should.be.an.Function()
      done()

    it "should return undefined values on rejected promises", (done)->
      p.spread (one, two, three)->
        one.should.equal 'hello'
        two.should.equal 'salut'
        console.log 'three', three
        expect(three).to.be.undefined
        done()

  describe 'settleProps', ->
    promises =
      one: promises_.resolve 'hello'
      two: promises_.resolve 'salut'
      three: promises_.reject new Error('goodbye')

    p = promises_.settleProps promises
    it "should return one promise", (done)->
      p.should.be.an.Object()
      p.then.should.be.an.Function()
      done()

    it "should return undefined values on rejected promises", (done)->
      p.then (res)->
        { one, two, three } = res
        one.should.equal 'hello'
        two.should.equal 'salut'
        console.log 'three', three
        expect(three).to.be.undefined
        done()
