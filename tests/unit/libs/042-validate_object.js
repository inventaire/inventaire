/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');

const should = require('should');
const validateObject = __.require('lib', 'validate_object');

describe('validate object', function() {
  it('should throw when passed an object with an invalid key', function(done){
    const validKeys = [ 'b' ];
    ((() => validateObject({ a: 1 }, validKeys))).should.throw();
    return done();
  });

  it('should not throw when passed an object with a valid key', function(done){
    const validKeys = [ 'b' ];
    ((() => validateObject({ b: 1 }, validKeys))).should.not.throw();
    return done();
  });

  it('should throw when passed an object with an invalid value', function(done){
    const validKeys = [ 'b' ];
    ((() => validateObject({ b: 1 }, validKeys, 'string'))).should.throw();
    return done();
  });

  return it('should not throw when passed an object with a valid value', function(done){
    const validKeys = [ 'b' ];
    ((() => validateObject({ b: 1 }, validKeys, 'number'))).should.not.throw();
    return done();
  });
});
