const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { Wait } = __.require('lib', 'promises')

if (CONFIG.env !== 'tests') {
  throw new Error(`invalid env: ${CONFIG.env}`)
}

const should = require('should')
const sinon = require('sinon')

const promises_ = __.require('lib', 'promises')

const cache_ = __.require('lib', 'cache')
const randomString = __.require('lib', './utils/random_string')

const hashKey = key => promises_.resolve(_.hashCode(key))
const workingFn = key => hashKey(key + randomString(8))
const failingFn = key => promises_.reject('Jag är Döden')

describe('cache', () => {
  describe('get', () => {
    it('should return a promise', done => {
      const p = cache_.get({ key: 'whatever', fn: hashKey.bind(null, 'yo') })
      p.should.have.property('then')
      p.should.have.property('catch')
      done()
    })

    it('should accept a key and a promisified function', done => {
      const key = 'whatever'
      cache_.get({ key, fn: hashKey.bind(null, key) })
      .then(() => done())
      .catch(done)
    })

    it('should compute ones and cache for the nexts', done => {
      const spy = sinon.spy()
      const key = '007'
      const hash = _.hashCode(key)
      const spiedHash = key => {
        spy()
        return hashKey(key)
      }

      const fn = spiedHash.bind(null, key)
      cache_.get({ key, fn })
      .then(res => {
        res.should.equal(hash)
        return cache_.get({ key, fn: spiedHash.bind(null, key) })
        .then(res => {
          res.should.equal(hash)
          return cache_.get({ key, fn: spiedHash.bind(null, key) })
          .then(res => {
            res.should.equal(hash)
            // MOUAHAHA YOU WONT SEE ME (◣_◢)
            return cache_.get({ key: '006', fn: spiedHash.bind(null, '006') })
            .then(res => {
              res.should.equal(_.hashCode('006'))
              return cache_.get({ key, fn: spiedHash.bind(null, key) })
              .then(res => {
                res.should.equal(hash)
                // DHO [>.<]
                spy.callCount.should.equal(2)
                done()
              })
            })
          })
        })
      })
      .catch(done)
    })

    it('should return the outdated version if the new version returns an error', done => {
      const key = 'doden'
      cache_.get({ key, fn: workingFn.bind(null, 'Vem är du?'), timespan: 0 })
      .then(res1 => {
        // returns an error: should return old value
        return cache_.get({ key, fn: failingFn.bind(null, 'Vem är du?'), timespan: 1 })
        .then(res2 => {
          // the error shouldnt have overriden the value
          return cache_.get({ key, fn: workingFn.bind(null, 'Vem är du?'), timespan: 5000 })
          .then(res3 => {
            res1.should.equal(res2)
            res1.should.equal(res3)
            done()
          })
        })
      })
      .catch(done)
    })

    it('should cache non-error empty results', done => {
      const spy = sinon.spy()
      const empty = key => {
        spy()
        return promises_.resolve(_.noop(key))
      }

      const key = 'gogogo'
      cache_.get({ key, fn: empty })
      .then(res1 => {
        should(res1).not.be.ok()
        return cache_.get({ key, fn: empty })
        .then(res2 => {
          should(res2).not.be.ok()
          spy.callCount.should.equal(1)
          done()
        })
      })
      .catch(done)
    })

    describe('timespan', () => {
      it('should refuse old value when passed a 0 timespan', done => {
        const key = 'doden'
        cache_.get({ key, fn: workingFn.bind(null, 'Vem är du?'), timespan: 0 })
        .then(Wait(10))
        .then(res1 => {
          // returns an error: should return old value
          return cache_.get({ key, fn: failingFn.bind(null, 'Vem är du?'), timespan: 0 })
          .then(res2 => {
            res1.should.be.ok()
            should(res2).not.be.ok()
            done()
          })
        })
        .catch(done)
      })
    })

    it('should also accept an expiration timespan', done => {
      const key = 'samekey'
      cache_.get({ key, fn: workingFn.bind(null, 'bla') })
      .then(res1 => {
        return cache_.get({ key, fn: workingFn.bind(null, 'different arg'), timespan: 10000 })
        .then(Wait(100))
        .then(res2 => {
          return cache_.get({ key, fn: workingFn.bind(null, 'different arg'), timespan: 0 })
          .then(Wait(100))
          .then(res3 => {
            res1.should.equal(res2)
            res2.should.not.equal(res3)
            done()
          })
        })
      })
      .catch(done)
    })

    describe('refresh', () => {
      it('should accept a refresh parameter', done => {
        const key = 'samekey'
        const fn = workingFn.bind(null, 'foo')
        cache_.get({ key, fn, timespan: 10000 })
        .then(Wait(100))
        .then(res1 => {
          return cache_.get({ key, fn })
          .then(res2 => {
            return cache_.get({ key, fn, refresh: true })
            .then(res3 => {
              res1.should.equal(res2)
              res1.should.not.equal(res3)
              done()
            })
          })
        })
        .catch(done)
      })
    })

    describe('dry', () => {
      it('should get a cached value with a dry parameter', done => {
        const key = randomString(4)
        const fn = workingFn.bind(null, 'foo')
        cache_.get({ key, fn })
        .then(Wait(100))
        .then(res1 => cache_.get({ key, dry: true })
        .then(res2 => {
          res1.should.equal(res2)
          done()
        }))
        .catch(done)
      })

      it('should return empty when no value was cached', done => {
        const key = randomString(4)
        cache_.get({ key, dry: true })
        .then(res => {
          should(res).not.be.ok()
          done()
        })
        .catch(done)
      })

      it('should return the fallback value when specified', done => {
        const key = randomString(4)
        const dryFallbackValue = 123
        cache_.get({ key, dry: true, dryFallbackValue })
        .then(res => {
          res.should.equal(dryFallbackValue)
          done()
        })
        .catch(done)
      })

      it('should populate the cache when requested', done => {
        const key = randomString(4)
        const fn = workingFn.bind(null, 'foo')
        cache_.get({ key, fn, dryAndCache: true })
        .then(Wait(10))
        .then(res1 => {
          should(res1).not.be.ok()
          cache_.get({ key, dry: true })
          .then(res2 => should(res2).be.ok())
          done()
        })
        .catch(done)
      })

      it('should be overriden by refresh', done => {
        const key = randomString(4)
        const fn = workingFn.bind(null, 'foo')
        cache_.get({ key, fn, refresh: true, dryAndCache: true })
        .then(Wait(10))
        .then(res1 => {
          should(res1).be.ok()
          done()
        })
        .catch(done)
      })
    })
  })

  describe('put', () => {
    it('should return a promise', done => {
      const p = cache_.put('whatever', 'somevalue')
      p.should.have.property('then')
      p.should.have.property('catch')
      done()
    })

    it('should return a rejected promise if not passed a key', done => {
      cache_.put(null, 'somevalue')
      .catch(err => {
        err.message.should.equal('invalid key')
        done()
      })
      .catch(done)
    })

    it('should return a rejected promise if not passed a value', done => {
      cache_.put('whatever', null)
      .catch(err => {
        err.message.should.equal('missing value')
        done()
      })
      .catch(done)
    })

    it('should put a value in the cache', done => {
      const key = randomString(8)
      const value = randomString(8)
      cache_.get({ key, dry: true })
      .then(cached => {
        should(cached).not.be.ok()
        return cache_.put(key, value)
      })
      .then(() => cache_.get({ key, dry: true }))
      .then(cached2 => {
        cached2.should.equal(value)
        done()
      })
      .catch(done)
    })
  })
})
