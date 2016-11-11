__ = require('config').universalPath
_ = __.require 'builders', 'utils'
should = require 'should'

promises_ = __.require 'lib', 'promises'

describe 'promises_', ->
  describe 'fallbackChain', ->
    it 'should return a promise', (done)->
      workingPromise = -> promises_.resolve 'yep'
      getters = [ workingPromise ]

      promises_.fallbackChain getters
      .then (res)->
        res.should.equal 'yep'
        done()

      return

    it 'should return the value of the first resolving promise', (done)->
      failingPromise = -> promises_.reject new Error('nop')
      workingPromise = -> promises_.resolve 'yep'
      workingPromise2 = -> promises_.resolve 'yep2'
      getters = [ failingPromise, workingPromise, workingPromise2 ]

      promises_.fallbackChain getters
      .then (res)->
        res.should.equal 'yep'
        done()

      return

    it 'should set individual timeouts on promises', (done)->
      failingPromise = -> promises_.reject new Error('nop')
      timeoutedPromise = -> promises_.resolve('yep').delay 20
      workingPromise2 = -> promises_.resolve('yep2').delay 5
      workingPromise3 = -> promises_.resolve 'yep3'
      getters = [ failingPromise, timeoutedPromise, workingPromise2, workingPromise3 ]

      promises_.fallbackChain getters, 10
      .then (res)->
        res.should.equal 'yep2'
        done()

      return
