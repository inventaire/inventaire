CONFIG = require('config')
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

if CONFIG.env isnt 'tests'
  throw new Error("invalid env: #{CONFIG.env}")

should = require 'should'
sinon = require 'sinon'

promises_ = __.require 'lib', 'promises'
{ Promise } = promises_

cache_ = __.require 'lib', 'cache'
randomString = __.require 'lib', './utils/random_string'

mookPromise = hashKey = (key)->
  promises_.resolve _.hashCode(key)

workingFn = (key)-> hashKey key + randomString(8)
failingFn = (key)-> promises_.reject 'Jag är Döden'

describe 'CACHE', ->
  describe 'get', ->
    it 'should return a promise', (done)->
      p = cache_.get('whatever', mookPromise.bind(null, 'yo'))
      p.should.have.property 'then'
      p.should.have.property 'catch'
      done()

    it 'should accept a key and a promisified function', (done)->
      key = 'whatever'
      cache_.get(key, mookPromise.bind(null, key))
      .then -> done()
      .catch done
      return

    it 'should compute ones and cache for the nexts', (done)->
      spy = sinon.spy()
      key = '007'
      hash = _.hashCode(key)
      spiedHash = (key)->
        spy()
        return hashKey(key)

      fn = spiedHash.bind(null, key)
      cache_.get key, fn
      .then (res)->
        res.should.equal hash
        cache_.get key, spiedHash.bind(null, key)
        .then (res)->
          res.should.equal hash
          cache_.get key, spiedHash.bind(null, key)
          .then (res)->
            res.should.equal hash
            # MOUAHAHA YOU WONT SEE ME (◣_◢)
            cache_.get '006', spiedHash.bind(null, '006')
            .then (res)->
              res.should.equal _.hashCode('006')
              cache_.get key, spiedHash.bind(null, key)
              .then (res)->
                res.should.equal hash
                # DHO [>.<]
                spy.callCount.should.equal 2
                done()
      .catch done
      return

    it 'should also accept an expiration timespan', (done)->
      cache_.get 'samekey', workingFn.bind(null, 'bla')
      .then (res1)->
        cache_.get 'samekey', workingFn.bind(null, 'different arg'), 10000
        .delay 100
        .then (res2)->
          cache_.get 'samekey', workingFn.bind(null, 'different arg'), 0
          .delay 100
          .then (res3)->
            _.log [ res1, res2, res3 ], 'results'
            res1.should.equal res2
            res2.should.not.equal res3
            done()
      .catch done
      return

    it 'should return the outdated version if the new version returns an error', (done)->
      cache_.get 'doden', workingFn.bind(null, 'Vem är du?'), 0
      .then (res1)->
        # returns an error: should return old value
        cache_.get 'doden', failingFn.bind(null, 'Vem är du?'), 1
        .then (res2)->
          # the error shouldnt have overriden the value
          cache_.get 'doden', workingFn.bind(null, 'Vem är du?'), 5000
          .then (res3)->
            _.log [ res1, res2, res3 ], 'results'
            res1.should.equal res2
            res1.should.equal res3
            done()
      .catch done
      return

    it 'should refuse old value when passed a 0 timespan', (done)->
      cache_.get 'doden', workingFn.bind(null, 'Vem är du?'), 0
      .delay 10
      .then (res1)->
        # returns an error: should return old value
        cache_.get 'doden', failingFn.bind(null, 'Vem är du?'), 0
        .then (res2)->
          res1.should.be.ok()
          should(res2).not.be.ok()
          done()
      .catch done
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
      .catch done
      return

  describe 'fastGet', ->
    it 'should return a promise', (done)->
      p = cache_.fastGet 'whatever', _.noop, 0, 0
      p.should.have.property 'then'
      p.should.have.property 'catch'
      done()

    it 'should return a rejected promise if not passed a key', (done)->
      cache_.fastGet()
      .catch -> done()

      return

    it 'should return a rejected promise if passed a non-number timestamp', (done)->
      cache_.fastGet 'whatever', 'notanumber'
      .catch -> done()

      return

    it 'should resolve to the cached value if something is cached', (done)->
      key = randomString 10
      fn = workingFn.bind null, 'whatever'
      cache_.get key, fn, 0
      .then (res1)->
        cache_.fastGet key, fn, 0, 0
        .then (res2)->
          res1.should.equal res2
          done()
      .catch done

      return

    it 'should resolve to undefined if nothing was cached', (done)->
      key = randomString 10
      fn = workingFn.bind null, 'whatever'
      cache_.fastGet key, fn, 0, 0
      .then (res)->
        should(res).not.be.ok()
        done()
      .catch done

      return

    it 'should then plan to fill the cache', (done)->
      key = randomString 10
      fn = workingFn.bind null, 'whatever'
      cache_.fastGet key, fn, 0, 0
      .delay 10
      .then (res1)->
        should(res1).not.be.ok()
        cache_.fastGet key, fn, 10000, 0
      .then (res2)->
        should(res2).be.ok()
        done()
      .catch done

      return

    it 'should resolve to the cached value if something is cached even if it expired', (done)->
      key = randomString 10
      fn = workingFn.bind null, 'whatever'
      cache_.fastGet key, fn, 0, 0
      .delay 10
      .then (res1)->
        should(res1).not.be.ok()
        cache_.fastGet key, fn, 0, 0
      .then (res2)->
        should(res2).be.ok()
        done()
      .catch done

      return

    it 'should delay update when requested', (done)->
      key = randomString 10
      fn = workingFn.bind null, 'whatever'
      cache_.fastGet key, fn, 0, 10
      .then (res1)->
        should(res1).not.be.ok()
        cache_.fastGet key, fn, 0, 10
      .then (res2)-> should(res2).not.be.ok()
      .delay 10
      .then -> cache_.fastGet key, fn, 0, 10
      .then (res3)->
        should(res3).be.ok()
        done()

      .catch done

      return

  describe 'dryGet', ->
    it 'should return a promise', (done)->
      p = cache_.dryGet 'whatever'
      p.should.have.property 'then'
      p.should.have.property 'catch'
      done()

    it 'should return a rejected promise if not passed a key', (done)->
      cache_.dryGet()
      .catch -> done()

      return

    it 'should return a rejected promise if passed a non-number timestamp', (done)->
      cache_.dryGet 'whatever', 'notanumber'
      .catch -> done()

      return

    it 'should return a value only when a value was cached', (done)->
      key = randomString 8
      cache_.dryGet key
      .then (cached)->
        should(cached).not.be.ok()
        # with caching
        cache_.get key, workingFn.bind(null, key)
        .then (cached2)->
          cache_.dryGet key
          .then (cached3)->
            should(cached3).be.ok()
            cached3.should.equal cached2
            done()
      .catch done

      return

    it "should return a value only if the timestamp isn't expired", (done)->
      key = randomString 8
      cache_.get key, workingFn.bind(null, key)
      .then (cached)->
        cache_.dryGet key, 10000
        .delay 10
        .then (cached2)->
          should(cached2).be.ok()
          cache_.dryGet key, 0
          .then (cached3)->
            should(cached3).not.be.ok()
            done()
      .catch done

      return

  describe 'put', ->
    it 'should return a promise', (done)->
      p = cache_.put 'whatever', 'somevalue'
      p.should.have.property 'then'
      p.should.have.property 'catch'
      done()

    it 'should return a rejected promise if not passed a key', (done)->
      cache_.put null, 'somevalue'
      .catch (err)->
        err.message.should.equal 'invalid key'
        done()
      .catch done

      return

    it 'should return a rejected promise if not passed a value', (done)->
      cache_.put 'whatever', null
      .catch (err)->
        err.message.should.equal 'missing value'
        done()
      .catch done

      return

    it 'should put a value in the cache', (done)->
      key = randomString 8
      value = randomString 8
      cache_.dryGet key
      .then (cached)->
        should(cached).not.be.ok()
        cache_.put key, value
      .then -> cache_.dryGet key
      .then (cached2)->
        cached2.should.equal value
        done()
      .catch done

      return
