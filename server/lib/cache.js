/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const error_ = __.require('lib', 'error/error');
const assert_ = __.require('utils', 'assert_types');

const levelBase = __.require('level', 'base');

const db = levelBase.simpleSubDb('cache');

const { offline } = CONFIG;

const { oneMinute, oneDay, oneMonth } =  __.require('lib', 'times');

module.exports = {
  // - key: the cache key
  // - fn: a function with its context and arguments binded
  // - timespan: maximum acceptable age of the cached value in ms
  // - refresh: alias for timespan=0
  // - dry: return what's in cache or nothing: if the cache is empty, do not call the function
  // - dryFallbackValue: the value to return when no cached value can be found, to keep responses
  //   type consistent
  get(params){
    let { key, fn, timespan, refresh, dry, dryAndCache, dryFallbackValue } = params;
    if (refresh) {
      timespan = 0;
      dry = false;
      dryAndCache = false;
    }
    if (timespan == null) { timespan = oneMonth; }
    if (dry == null) { dry = false; }
    if (dryAndCache == null) { dryAndCache = false; }

    try {
      assert_.string(key);
      if (!dry) { assert_.types([ 'function', 'number' ], [ fn, timespan ]); }
    } catch (error) {
      const err = error;
      return error_.reject(err, 500);
    }

    // Try to avoid cache miss when making a dry get
    // or when working offline (only useful in development)
    if (dry || offline) { timespan = Infinity; }

    // When passed a 0 timespan, it is expected to get a fresh value.
    // Refusing the old value is also a way to invalidate the current cache
    const refuseOldValue = timespan === 0;

    return checkCache(key, timespan)
    .then(requestOnlyIfNeeded(key, fn, dry, dryAndCache, dryFallbackValue, refuseOldValue))
    .catch(function(err){
      const label = `final cache_ err: ${key}`;
      // not logging the stack trace in case of 404 and alikes
      if (/^4/.test(err.statusCode)) { _.warn(err, label);
      } else { _.error(err, label); }

      throw err;
    });
  },

  put(key, value){
    if (!_.isNonEmptyString(key)) { return error_.reject('invalid key', 500); }

    if (value == null) { return error_.reject('missing value', 500); }

    return putResponseInCache(key, value);
  }
};

var checkCache = (key, timespan) => db.get(key)
.then(function(res){
  // Returning nothing will trigger a new request
  if (res == null) { return; }

  const { body, timestamp } = res;

  // Reject outdated cached values
  if (!isFreshEnough(timestamp, timespan)) { return; }

  // In case there was nothing in cache
  if (_.isEmpty(body)) {
    // Prevent re-requesting if it was already retried lately
    if (isFreshEnough(timestamp, 2 * oneDay)) {
      // _.info key, 'empty cache value: retried lately'
      return res;
    }
    // Otherwise, trigger a new request by returning nothing
    // _.info key, 'empty cache value: retrying'
    return;
  } else {
    return res;
  }
});

var requestOnlyIfNeeded = (key, fn, dry, dryAndCache, dryFallbackValue, refuseOldValue) => (function(cached) {
  if (cached != null) {
    // _.info "from cache: #{key}"
    return cached.body;
  }

  if (dry) {
    // _.info "empty cache on dry get: #{key}"
    return dryFallbackValue;
  }

  if (dryAndCache) {
    // _.info "returning and populating cache: #{key}"
    populate(key, fn, refuseOldValue)
    .catch(_.Error(`dryAndCache: ${key}`));
    return dryFallbackValue;
  }

  return populate(key, fn, refuseOldValue);
});

var populate = (key, fn, refuseOldValue) => fn()
.then(function(res){
  // _.info "from remote data source: #{key}"
  putResponseInCache(key, res);
  return res;}).catch(function(err){
  if (refuseOldValue) {
    _.warn(err, `${key} request err (returning nothing)`);
    return;
  } else {
    _.warn(err, `${key} request err (returning old value)`);
    return returnOldValue(key, err);
  }
});

var putResponseInCache = (key, res) => // _.info "caching #{key}"
db.put(key, {
  body: res,
  timestamp: new Date().getTime()
});

var isFreshEnough = (timestamp, timespan) => !_.expired(timestamp, timespan);

var returnOldValue = (key, err) => checkCache(key, Infinity)
.then(function(res){
  if (res != null) { return res.body;
  } else {
    // rethrowing the previous error as it's probably more meaningful
    err.old_value = null;
    throw err;
  }
});
