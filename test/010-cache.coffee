CONFIG = require('config')
__ = CONFIG.root
_ = __.require 'builders', 'utils'

should = require 'should'
sinon = require 'sinon'

promises_ = __.require 'lib', 'promises'
Promise = promises_.Promise

cache_ = __.require 'lib', 'cache'

mookPromise = hashKey = (key)->
  promises_.resolvedPromise _.hashCode(key)

Ctx =
  method: (key)-> hashKey key + @value
  value: -> _.random(1000)

describe 'CACHE', ->
  describe 'get', ->
    it "should return a promise", (done)->
      p = cache_.get('whatever', mookPromise)
      p.should.have.property 'then'
      p.should.have.property 'catch'
      done()

    it "should accept a key and a promisified method", (done)->
      cache_.get('whatever', mookPromise)
      .then -> done()

    it "should accept a key, a promisified method, its context and/or arguements", (done)->
      Promise.all([
        cache_.get('whatever', Ctx.method)
        cache_.get('whatever', Ctx.method, Ctx)
        cache_.get('whatever', Ctx.method, Ctx, ['whatever'])
        cache_.get('not cached before', hashKey, null, ['will be the args!!'])
      ])
      .spread (one, two, three, four)->
        # the random function will be neutralized by the cache
        (one is two is three).should.equal true
        four.should.equal _.hashCode 'will be the args!!'
        done()

    it "should throw in other cases", (done)->
      i = 0
      Promise.all([
        cache_.get('whatever').catch -> i++
        cache_.get('whatever', mookPromise, 'yo').catch -> i++
        cache_.get('whatever', 'not a function').catch -> i++
        cache_.get('whatever', 'not a function', ['bla']).catch -> i++
      ])
      .then ->
        i.should.equal 4
        done()

    it "should return the value asked", (done)->
      key = 'hello!'
      hash = _.hashCode(key)
      cache_.get(key, hashKey)
      .then (res)->
        res.should.equal hash
        done()


    it "should compute ones and cache for the nexts", (done)->
      spy = sinon.spy()
      key = '007'
      hash = _.hashCode(key)
      spiedHash = (key)->
        spy()
        return hashKey(key)

      cache_.get(key, spiedHash).then (res)->
        res.should.equal hash
        cache_.get(key, spiedHash).then (res)->
          res.should.equal hash
          cache_.get(key, spiedHash).then (res)->
            res.should.equal hash
            # MOUAHAHA YOU WONT SEE ME (◣_◢)
            cache_.get('006', spiedHash).then (res)->
              res.should.equal _.hashCode('006')
              cache_.get(key, spiedHash).then (res)->
                res.should.equal hash
                # DHO [>.<]
                spy.callCount.should.equal 2
                done()

    it "should also accept an expiration timespan", (done)->
      console.time 'global'
      console.time 'one'
      cache_.get('samekey', Ctx.method, null, null)
      .then (res1)->
        console.timeEnd 'one'
        console.time 'two'
        cache_.get('samekey', Ctx.method, null, ['different arg'], 10000)
        .then (res2)->
          console.timeEnd 'two'
          console.time 'three'
          cache_.get('samekey', Ctx.method, null, ['different arg'], 0)
          .then (res3)->
            console.timeEnd 'three'
            console.timeEnd 'global'
            _.log [res1, res2, res3], 'results'
            res1.should.equal res2
            res2.should.not.equal res3
            done()