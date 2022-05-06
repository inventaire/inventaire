const CONFIG = require('config')
const { ttlCheckFrequency } = CONFIG.leveldb
const _ = require('builders/utils')
const { wait } = require('lib/promises')
const { shouldNotBeCalled } = require('../utils')
if (CONFIG.env !== 'tests-unit') throw new Error(`invalid env: ${CONFIG.env}`)

const should = require('should')
const sinon = require('sinon')

const cache_ = require('lib/cache')
const randomString = require('lib/utils/random_string')

const hashKey = async key => _.hashCode(key)
const getSomeRandomValue = async () => randomString(8)
const failingFn = async () => {
  const err = new Error('Jag är Döden')
  err.code = 'that_failing_fn_error'
  throw err
}

describe('cache', () => {
  describe('get', () => {
    it('should return a promise', async () => {
      const p = cache_.get({ key: 'whatever', fn: hashKey.bind(null, 'yo') })
      p.should.have.property('then')
      p.should.have.property('catch')
    })

    it('should accept a key and a promisified function', async () => {
      const key = 'whatever'
      await cache_.get({ key, fn: hashKey.bind(null, key) })
    })

    it('should compute ones and cache for the nexts', async () => {
      const spy = sinon.spy()
      const keyA = randomString(8)
      const keyB = randomString(8)
      const someFn = key => key + key
      const spiedFn = async key => {
        spy()
        return someFn(key)
      }

      spy.callCount.should.equal(0)
      const res1 = await cache_.get({ key: keyA, fn: spiedFn.bind(null, keyA) })
      res1.should.equal(someFn(keyA))
      spy.callCount.should.equal(1)
      const res2 = await cache_.get({ key: keyA, fn: spiedFn.bind(null, keyA) })
      res2.should.equal(someFn(keyA))
      spy.callCount.should.equal(1)
      const res3 = await cache_.get({ key: keyB, fn: spiedFn.bind(null, keyB) })
      res3.should.equal(someFn(keyB))
      spy.callCount.should.equal(2)
      const res4 = await cache_.get({ key: keyA, fn: spiedFn.bind(null, keyA) })
      res4.should.equal(someFn(keyA))
      spy.callCount.should.equal(2)
    })

    it('should pass the error when a cache miss is followed by a function throwing an error', async () => {
      const key = randomString(8)
      await cache_.get({ key, fn: failingFn })
      .then(shouldNotBeCalled)
      .catch(err => {
        err.code.should.equal('that_failing_fn_error')
      })
    })

    it('should cache non-error empty results', async () => {
      const spy = sinon.spy()
      const empty = async () => { spy() }

      const key = randomString(8)
      const res1 = await cache_.get({ key, fn: empty })
      should(res1).not.be.ok()
      const res2 = await cache_.get({ key, fn: empty })
      should(res2).not.be.ok()
      spy.callCount.should.equal(1)
    })

    describe('ttl', () => {
      it('should remove a key/value from cache after the ttl expired', async () => {
        const key = randomString(8)
        const res1 = await cache_.get({ key, fn: getSomeRandomValue, ttl: 1 })
        should(res1).be.ok()
        await wait(ttlCheckFrequency + 100)
        const res2 = await cache_.get({ key, dry: true })
        should(res2).not.be.ok()
      })
    })

    describe('refresh', () => {
      it('should force a refresh', async () => {
        const key = randomString(8)
        const res1 = await cache_.get({ key, fn: getSomeRandomValue })
        const res2 = await cache_.get({ key, fn: getSomeRandomValue })
        const res3 = await cache_.get({ key, fn: getSomeRandomValue, refresh: true })
        res1.should.equal(res2)
        res1.should.not.equal(res3)
      })
    })

    describe('dry', () => {
      it('should get a cached value with a dry parameter', async () => {
        const key = randomString(8)
        const res1 = await cache_.get({ key, fn: getSomeRandomValue })
        const res2 = await cache_.get({ key, dry: true })
        res1.should.equal(res2)
      })

      it('should return empty when no value was cached', async () => {
        const key = randomString(8)
        const res = await cache_.get({ key, dry: true })
        should(res).not.be.ok()
      })

      it('should return the fallback value when specified', async () => {
        const key = randomString(8)
        const dryFallbackValue = 123
        const res = await cache_.get({ key, dry: true, dryFallbackValue })
        res.should.equal(dryFallbackValue)
      })

      it('should populate the cache when requested', async () => {
        const key = randomString(8)
        const fn = getSomeRandomValue.bind(null, 'foo')
        const res1 = await cache_.get({ key, fn, dryAndCache: true })
        should(res1).not.be.ok()
        const res2 = await cache_.get({ key, dry: true })
        should(res2).be.ok()
      })

      it('should be overriden by refresh', async () => {
        const key = randomString(8)
        const fn = getSomeRandomValue.bind(null, 'foo')
        const res1 = await cache_.get({ key, fn, refresh: true, dryAndCache: true })
        should(res1).be.ok()
      })
    })
  })

  describe('put', () => {
    it('should return a promise', async () => {
      const p = cache_.put('whatever', 'somevalue')
      p.should.have.property('then')
      p.should.have.property('catch')
    })

    it('should return a rejected promise if not passed a key', async () => {
      await cache_.put(null, 'somevalue')
      .then(shouldNotBeCalled)
      .catch(err => {
        err.message.should.equal('invalid key')
      })
    })

    it('should return a rejected promise if not passed a value', async () => {
      await cache_.put('whatever', null)
      .then(shouldNotBeCalled)
      .catch(err => {
        err.message.should.equal('missing value')
      })
    })

    it('should put a value in the cache', async () => {
      const key = randomString(8)
      const value = randomString(8)
      const cached = await cache_.get({ key, dry: true })
      should(cached).not.be.ok()
      await cache_.put(key, value)
      const cached2 = await cache_.get({ key, dry: true })
      cached2.should.equal(value)
    })
  })
})
