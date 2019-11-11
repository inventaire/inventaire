/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath;
const _ = __.require('builders', 'utils');
const promises_ = __.require('lib', 'promises');
const error_ = __.require('lib', 'error/error');

module.exports = function(params){
  let { updateFn, maxAttempts } = params;
  if (!maxAttempts) { maxAttempts = 10; }
  return function(...args){
    var run = function(attemptsCount){
      if (attemptsCount > maxAttempts) {
        throw error_.new('maximum attempt reached', 400, { updateFn, maxAttempts, args });
      }

      attemptsCount += 1;

      return updateFn.apply(null, args)
      .catch(function(err){
        if (err.statusCode === 409) { return runAfterDelay(run, attemptsCount, err);
        } else { throw err; }
      });
    };

    return run(1);
  };
};

var runAfterDelay = function(run, attemptsCount, err){
  const delay = (attemptsCount * 100) + Math.trunc(Math.random() * 100);

  return promises_.resolve()
  .delay(delay)
  .then(() => run(attemptsCount));
};
