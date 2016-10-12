CONFIG = require('config')
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

should = require 'should'
sinon = require 'sinon'

promises_ = __.require 'lib', 'promises'
{ Promise } = promises_

cache_ = __.require 'lib', 'cache'

mookPromise = hashKey = (key)->
  promises_.resolve _.hashCode(key)

Ctx =
  method: (key)-> hashKey key + @value
  failingMethod: (key)-> promises_.reject('Jag är Döden')
  value: -> _.random(1000)

describe 'CACHE', ->
  describe 'get', ->
    it 'should return a promise', (done)->
      p = cache_.get('whatever', mookPromise.bind(null, 'yo'))
      p.should.have.property 'then'
      p.should.have.property 'catch'
      done()

    it 'should accept a key and a promisified method', (done)->
      key = 'whatever'
      cache_.get(key, mookPromise.bind(null, key))
      .then -> done()
      return

    it 'should compute ones and cache for the nexts', (done)->
      spy = sinon.spy()
      key = '007'
      hash = _.hashCode(key)
      spiedHash = (key)->
        spy()
        return hashKey(key)

      method = spiedHash.bind(null, key)
      cache_.get(key, method).then (res)->
        res.should.equal hash
        cache_.get(key, spiedHash.bind(null, key)).then (res)->
          res.should.equal hash
          cache_.get(key, spiedHash.bind(null, key)).then (res)->
            res.should.equal hash
            # MOUAHAHA YOU WONT SEE ME (◣_◢)
            cache_.get('006', spiedHash.bind(null, '006')).then (res)->
              res.should.equal _.hashCode('006')
              cache_.get(key, spiedHash.bind(null, key)).then (res)->
                res.should.equal hash
                # DHO [>.<]
                spy.callCount.should.equal 2
                done()
      return

    it 'should also accept an expiration timespan', (done)->
      cache_.get('samekey', Ctx.method)
      .then (res1)->
        cache_.get('samekey', Ctx.method.bind(Ctx, 'different arg'), 10000)
        .then (res2)->
          cache_.get('samekey', Ctx.method.bind(Ctx, 'different arg'), 0)
          .then (res3)->
            _.log [res1, res2, res3], 'results'
            res1.should.equal res2
            res2.should.not.equal res3
            done()
      return

    it 'should return the outdated version if the new version returns an error', (done)->
      cache_.get('doden', Ctx.method.bind(Ctx, 'Vem är du?'), 0)
      .then (res1)->
        # returns an error: should return old value
        cache_.get('doden', Ctx.failingMethod.bind(Ctx, 'Vem är du?'), 1)
        .then (res2)->
          # the error shouldnt have overriden the value
          cache_.get('doden', Ctx.method.bind(Ctx, 'Vem är du?'), 5000)
          .then (res3)->
            _.log [res1, res2, res3], 'results'
            res1.should.equal res2
            res1.should.equal res3
            done()
      return

    it 'should refuse old value when passed a 0 timespan', (done)->
      cache_.get('doden', Ctx.method.bind(Ctx, 'Vem är du?'), 0)
      .then (res1)->
        # returns an error: should return old value
        cache_.get('doden', Ctx.failingMethod.bind(Ctx, 'Vem är du?'), 0)
        .then (res2)->
          res1.should.be.ok()
          should(res2).not.be.ok()
          done()
      return

    it 'should cache non-error empty results', (done)->
      spy = sinon.spy()
      empty = (key)->
        spy()
        return promises_.resolve _.noop(key)

      cache_.get 'gogogo', empty
      .then (res1)->
        should(res1).not.be.ok()
        cache_.get 'gogogo', empty
        .then (res2)->
          should(res2).not.be.ok()
          spy.callCount.should.equal 1
          done()
      return
