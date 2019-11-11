/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let hashKey;
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');

if (CONFIG.env !== 'tests') {
  throw new Error(`invalid env: ${CONFIG.env}`);
}

const should = require('should');
const sinon = require('sinon');

const promises_ = __.require('lib', 'promises');
const { Promise } = promises_;

const cache_ = __.require('lib', 'cache');
const randomString = __.require('lib', './utils/random_string');

const mookPromise = (hashKey = key => promises_.resolve(_.hashCode(key)));

const workingFn = key => hashKey(key + randomString(8));
const failingFn = key => promises_.reject('Jag är Döden');

describe('cache', function() {
  describe('get', function() {
    it('should return a promise', function(done){
      const p = cache_.get({ key: 'whatever', fn: mookPromise.bind(null, 'yo') });
      p.should.have.property('then');
      p.should.have.property('catch');
      return done();
    });

    it('should accept a key and a promisified function', function(done){
      const key = 'whatever';
      cache_.get({ key, fn: mookPromise.bind(null, key) })
      .then(() => done())
      .catch(done);
    });

    it('should compute ones and cache for the nexts', function(done){
      const spy = sinon.spy();
      const key = '007';
      const hash = _.hashCode(key);
      const spiedHash = function(key){
        spy();
        return hashKey(key);
      };

      const fn = spiedHash.bind(null, key);
      cache_.get({ key, fn })
      .then(function(res){
        res.should.equal(hash);
        return cache_.get({ key, fn: spiedHash.bind(null, key) })
        .then(function(res){
          res.should.equal(hash);
          return cache_.get({ key, fn: spiedHash.bind(null, key) })
          .then(function(res){
            res.should.equal(hash);
            // MOUAHAHA YOU WONT SEE ME (◣_◢)
            return cache_.get({ key: '006', fn: spiedHash.bind(null, '006') })
            .then(function(res){
              res.should.equal(_.hashCode('006'));
              return cache_.get({ key, fn: spiedHash.bind(null, key) })
              .then(function(res){
                res.should.equal(hash);
                // DHO [>.<]
                spy.callCount.should.equal(2);
                return done();
              });
            });
          });
        });}).catch(done);
    });

    it('should return the outdated version if the new version returns an error', function(done){
      const key = 'doden';
      cache_.get({ key, fn: workingFn.bind(null, 'Vem är du?'), timespan: 0 })
      .then(res1 => // returns an error: should return old value
      cache_.get({ key, fn: failingFn.bind(null, 'Vem är du?'), timespan: 1 })
      .then(res2 => // the error shouldnt have overriden the value
      cache_.get({ key, fn: workingFn.bind(null, 'Vem är du?'), timespan: 5000 })
      .then(function(res3){
        res1.should.equal(res2);
        res1.should.equal(res3);
        return done();
      }))).catch(done);
    });

    it('should cache non-error empty results', function(done){
      const spy = sinon.spy();
      const empty = function(key){
        spy();
        return promises_.resolve(_.noop(key));
      };

      const key = 'gogogo';
      cache_.get({ key, fn: empty })
      .then(function(res1){
        should(res1).not.be.ok();
        return cache_.get({ key, fn: empty })
        .then(function(res2){
          should(res2).not.be.ok();
          spy.callCount.should.equal(1);
          return done();
        });}).catch(done);
    });

    describe('timespan', () => it('should refuse old value when passed a 0 timespan', function(done){
      const key = 'doden';
      cache_.get({ key, fn: workingFn.bind(null, 'Vem är du?'), timespan: 0 })
      .delay(10)
      .then(res1 => // returns an error: should return old value
      cache_.get({ key, fn: failingFn.bind(null, 'Vem är du?'), timespan: 0 })
      .then(function(res2){
        res1.should.be.ok();
        should(res2).not.be.ok();
        return done();
      })).catch(done);
    }));

    it('should also accept an expiration timespan', function(done){
      const key = 'samekey';
      cache_.get({ key, fn: workingFn.bind(null, 'bla') })
      .then(res1 => cache_.get({ key, fn: workingFn.bind(null, 'different arg'), timespan: 10000 })
      .delay(100)
      .then(res2 => cache_.get({ key, fn: workingFn.bind(null, 'different arg'), timespan: 0 })
      .delay(100)
      .then(function(res3){
        res1.should.equal(res2);
        res2.should.not.equal(res3);
        return done();
      }))).catch(done);
    });

    describe('refresh', () => it('should accept a refresh parameter', function(done){
      const key = 'samekey';
      const fn = workingFn.bind(null, 'foo');
      cache_.get({ key, fn, timespan: 10000 })
      .delay(100)
      .then(res1 => cache_.get({ key, fn })
      .then(res2 => cache_.get({ key, fn, refresh: true })
      .then(function(res3){
        res1.should.equal(res2);
        res1.should.not.equal(res3);
        return done();
      }))).catch(done);
    }));

    return describe('dry', function() {
      it('should get a cached value with a dry parameter', function(done){
        const key = randomString(4);
        const fn = workingFn.bind(null, 'foo');
        cache_.get({ key, fn })
        .delay(100)
        .then(res1 => cache_.get({ key, dry: true })
        .then(function(res2){
          res1.should.equal(res2);
          return done();
        })).catch(done);
      });

      it('should return empty when no value was cached', function(done){
        const key = randomString(4);
        cache_.get({ key, dry: true })
        .then(function(res){
          should(res).not.be.ok();
          return done();}).catch(done);
      });

      it('should return the fallback value when specified', function(done){
        const key = randomString(4);
        const dryFallbackValue = 123;
        cache_.get({ key, dry: true, dryFallbackValue })
        .then(function(res){
          res.should.equal(dryFallbackValue);
          return done();}).catch(done);
      });

      it('should populate the cache when requested', function(done){
        const key = randomString(4);
        const fn = workingFn.bind(null, 'foo');
        cache_.get({ key, fn, dryAndCache: true })
        .delay(10)
        .then(function(res1){
          should(res1).not.be.ok();
          cache_.get({ key, dry: true })
          .then(res2 => should(res2).be.ok());
          return done();}).catch(done);
      });

      return it('should be overriden by refresh', function(done){
        const key = randomString(4);
        const fn = workingFn.bind(null, 'foo');
        cache_.get({ key, fn, refresh:true, dryAndCache: true })
        .delay(10)
        .then(function(res1){
          should(res1).be.ok();
          return done();}).catch(done);
      });
    });
  });

  return describe('put', function() {
    it('should return a promise', function(done){
      const p = cache_.put('whatever', 'somevalue');
      p.should.have.property('then');
      p.should.have.property('catch');
      return done();
    });

    it('should return a rejected promise if not passed a key', function(done){
      cache_.put(null, 'somevalue')
      .catch(function(err){
        err.message.should.equal('invalid key');
        return done();}).catch(done);

    });

    it('should return a rejected promise if not passed a value', function(done){
      cache_.put('whatever', null)
      .catch(function(err){
        err.message.should.equal('missing value');
        return done();}).catch(done);

    });

    return it('should put a value in the cache', function(done){
      const key = randomString(8);
      const value = randomString(8);
      cache_.get({ key, dry: true })
      .then(function(cached){
        should(cached).not.be.ok();
        return cache_.put(key, value);}).then(() => cache_.get({ key, dry: true }))
      .then(function(cached2){
        cached2.should.equal(value);
        return done();}).catch(done);

    });
  });
});
