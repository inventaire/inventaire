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

describe 'cache', ->
  describe 'get', ->
    it 'should return a promise', (done)->
      p = cache_.get { key: 'whatever', fn: mookPromise.bind(null, 'yo') }
      p.should.have.property 'then'
      p.should.have.property 'catch'
      done()

    it 'should accept a key and a promisified function', (done)->
      key = 'whatever'
      cache_.get { key, fn: mookPromise.bind(null, key) }
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
      cache_.get { key, fn }
      .then (res)->
        res.should.equal hash
        cache_.get { key, fn: spiedHash.bind(null, key) }
        .then (res)->
          res.should.equal hash
          cache_.get { key, fn: spiedHash.bind(null, key) }
          .then (res)->
            res.should.equal hash
            # MOUAHAHA YOU WONT SEE ME (◣_◢)
            cache_.get { key: '006', fn: spiedHash.bind(null, '006') }
            .then (res)->
              res.should.equal _.hashCode('006')
              cache_.get { key, fn: spiedHash.bind(null, key) }
              .then (res)->
                res.should.equal hash
                # DHO [>.<]
                spy.callCount.should.equal 2
                done()
      .catch done
      return

    it 'should return the outdated version if the new version returns an error', (done)->
      key = 'doden'
      cache_.get { key, fn: workingFn.bind(null, 'Vem är du?'), timespan: 0 }
      .then (res1)->
        # returns an error: should return old value
        cache_.get { key, fn: failingFn.bind(null, 'Vem är du?'), timespan: 1 }
        .then (res2)->
          # the error shouldnt have overriden the value
          cache_.get { key, fn: workingFn.bind(null, 'Vem är du?'), timespan: 5000 }
          .then (res3)->
            res1.should.equal res2
            res1.should.equal res3
            done()
      .catch done
      return

    it 'should cache non-error empty results', (done)->
      spy = sinon.spy()
      empty = (key)->
        spy()
        return promises_.resolve _.noop(key)

      key = 'gogogo'
      cache_.get { key, fn: empty }
      .then (res1)->
        should(res1).not.be.ok()
        cache_.get { key, fn: empty }
        .then (res2)->
          should(res2).not.be.ok()
          spy.callCount.should.equal 1
          done()
      .catch done
      return

    describe 'timespan', ->
      it 'should refuse old value when passed a 0 timespan', (done)->
        key = 'doden'
        cache_.get { key, fn: workingFn.bind(null, 'Vem är du?'), timespan: 0 }
        .delay 10
        .then (res1)->
          # returns an error: should return old value
          cache_.get { key, fn: failingFn.bind(null, 'Vem är du?'), timespan: 0 }
          .then (res2)->
            res1.should.be.ok()
            should(res2).not.be.ok()
            done()
        .catch done
        return

    it 'should also accept an expiration timespan', (done)->
      key = 'samekey'
      cache_.get { key, fn: workingFn.bind(null, 'bla') }
      .then (res1)->
        cache_.get { key, fn: workingFn.bind(null, 'different arg'), timespan: 10000 }
        .delay 100
        .then (res2)->
          cache_.get { key, fn: workingFn.bind(null, 'different arg'), timespan: 0 }
          .delay 100
          .then (res3)->
            res1.should.equal res2
            res2.should.not.equal res3
            done()
      .catch done
      return

    describe 'refresh', ->
      it 'should accept a refresh parameter', (done)->
        key = 'samekey'
        fn = workingFn.bind null, 'foo'
        cache_.get { key, fn, timespan: 10000 }
        .delay 100
        .then (res1)->
          cache_.get { key, fn }
          .then (res2)->
            cache_.get { key, fn, refresh: true }
            .then (res3)->
              res1.should.equal res2
              res1.should.not.equal res3
              done()
        .catch done
        return

    describe 'dry', ->
      it 'should get a cached value with a dry parameter', (done)->
        key = randomString 4
        fn = workingFn.bind null, 'foo'
        cache_.get { key, fn }
        .delay 100
        .then (res1)->
          cache_.get { key, dry: true }
          .then (res2)->
            res1.should.equal res2
            done()
        .catch done
        return

      it 'should return empty when no value was cached', (done)->
        key = randomString 4
        cache_.get { key, dry: true }
        .then (res)->
          should(res).not.be.ok()
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
      cache_.get { key, dry: true }
      .then (cached)->
        should(cached).not.be.ok()
        cache_.put key, value
      .then -> cache_.get { key, dry: true }
      .then (cached2)->
        cached2.should.equal value
        done()
      .catch done

      return
