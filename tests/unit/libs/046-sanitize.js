/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const should = require('should');
const sanitize = __.require('lib', 'sanitize/sanitize');
const { undesiredRes } = require('../utils');

describe('sanitize', function() {
  it('should be a function', function(done){
    sanitize.should.be.a.Function();
    return done();
  });

  it('should return a promise', function(done){
    sanitize().catch(err => done());
  });

  it('should reject invalid req objects based on req.query existance', function(done){
    const req = {};
    const configs = {};
    sanitize(req, {}, configs)
    .catch(function(err){
      err.message.should.startWith('TypeError: expected object, got undefined');
      return done();}).catch(done);

  });

  it('should add a warning for unknown parameter (server error)', function(done){
    const req = { query: { foo: 1000 } };
    const res = {};
    const configs = {
      foo: {}
    };
    sanitize(req, res, configs)
    .then(function(input){
      input.should.deepEqual({});
      res.warnings.should.be.an.Object();
      res.warnings.parameters.should.deepEqual([
        'unexpected config parameter: foo'
      ]);
      return done();}).catch(done);

  });

  it('should add a warning for unexpected parameter (user error)', function(done){
    const req = { query: { limit: 1000 } };
    const res = {};
    const configs = {};
    sanitize(req, res, configs)
    .then(function(input){
      input.should.deepEqual({});
      res.warnings.should.be.an.Object();
      res.warnings.parameters.should.deepEqual([
        'unexpected parameter: limit'
      ]);
      return done();}).catch(done);

  });

  describe('optional parameters', function() {
    it('should accept optional parameters', function(done){
      const req = { query: {} };
      const res = {};
      const configs =
        {ids: { optional: true }};
      sanitize(req, res, configs)
      .then(function(input){
        Object.keys(input).length.should.equal(0);
        return done();}).catch(done);

    });

    return it('should still validate optional parameters', function(done){
      const req = { query: { lang: '1212515' } };
      const res = {};
      const configs = { lang: { optional: true } };
      sanitize(req, res, configs)
      .then(undesiredRes(done))
      .catch(function(err){
        err.message.should.equal('invalid lang: 1212515');
        return done();}).catch(done);

    });
  });

  describe('secret parameter', () => it('should not return the value', function(done){
    const req = { query: { password: 'a' } };
    const configs = { password: {} };
    sanitize(req, {}, configs)
    .then(undesiredRes(done))
    .catch(function(err){
      err.context.value.should.equal('*');
      return done();}).catch(done);

  }));

  describe('generic parameter', function() {
    it('should accept generic parameters', function(done){
      const req = { query: { 'include-users': true } };
      const res = {};

      const configs = {
        'include-users': {
          generic: 'boolean',
          default: false
        }
      };

      sanitize(req, res, configs)
      .then(function(input){
        input.includeUsers.should.be.true();
        return done();}).catch(done);

    });

    it('should throw when passed an invalid generic name', function(done){
      const req = { query: {} };
      const res = {};

      const obj = {};

      const configs = {
        foo: {
          generic: 'bar'
        }
      };

      sanitize(req, res, configs)
      .then(undesiredRes(done))
      .catch(function(err){
        err.message.should.equal('invalid generic name');
        return done();}).catch(done);

    });

    return it('should clone default values', function(done){
      const req = { query: {} };
      const res = {};

      const obj = {};

      const configs = {
        foo: {
          generic: 'object',
          default: obj
        }
      };

      sanitize(req, res, configs)
      .then(function(input){
        input.foo.should.deepEqual({});
        input.foo.should.not.equal(obj);
        return done();}).catch(done);

    });
  });

  describe('strictly positive integer', function() {
    it('should accept string values', function(done){
      const req = { query: { limit: '5' } };
      const configs = { limit: {} };
      sanitize(req, {}, configs)
      .then(function(input){
        input.limit.should.equal(5);
        return done();}).catch(done);

    });

    it('should accept a default value', function(done){
      const req = { query: {} };
      const configs = { limit: { default: 100 } };
      sanitize(req, {}, configs)
      .then(function(input){
        input.limit.should.equal(100);
        return done();}).catch(done);

    });

    it('should accept a max value', function(done){
      const req = { query: { limit: 1000 } };
      const res = {};
      const configs = { limit: { max: 500 } };
      sanitize(req, res, configs)
      .then(function(input){
        input.limit.should.equal(500);
        res.warnings.should.be.an.Object();
        res.warnings.parameters.should.deepEqual([
          "limit can't be over 500"
        ]);
        return done();}).catch(done);

    });

    it('should reject negative values', function(done){
      const req = { query: { limit: '-5' } };
      const configs = { limit: {} };
      sanitize(req, {}, configs)
      .then(undesiredRes(done))
      .catch(function(err){
        err.message.should.equal('invalid limit: -5');
        return done();}).catch(done);

    });

    it('should reject non-integer values', function(done){
      const req = { query: { limit: '5.5' } };
      const configs = { limit: {} };
      sanitize(req, {}, configs)
      .then(undesiredRes(done))
      .catch(function(err){
        err.message.should.equal('invalid limit: 5.5');
        return done();}).catch(done);

    });

    return it('should reject non-number values', function(done){
      const req = { query: { limit: 'bla' } };
      const configs = { limit: {} };
      sanitize(req, {}, configs)
      .then(undesiredRes(done))
      .catch(function(err){
        err.message.should.equal('invalid limit: bla');
        return done();}).catch(done);

    });
  });

  describe('couch uuid', function() {
    it('should reject invalid uuids values', function(done){
      const req = { query: { user: 'foo' } };
      const configs = { user: {} };
      sanitize(req, {}, configs)
      .then(undesiredRes(done))
      .catch(function(err){
        err.message.should.equal('invalid user: foo');
        return done();}).catch(done);

    });

    return it('should accept valid uuids', function(done){
      const req = { query: { user: '00000000000000000000000000000000' } };
      const configs = { user: {} };
      sanitize(req, {}, configs)
      .then(function(input){
        input.user.should.equal('00000000000000000000000000000000');
        input.userId.should.equal('00000000000000000000000000000000');
        return done();}).catch(done);

    });
  });

  describe('string with specific length', function() {
    it('should reject a token of invalid type', function(done){
      const req = { query: { token: 1251251 } };
      const configs = { token: { length: 32 } };
      sanitize(req, {}, configs)
      .then(undesiredRes(done))
      .catch(function(err){
        err.message.should.equal('invalid token: expected string, got number');
        return done();}).catch(done);

    });

    return it('should reject an invalid token', function(done){
      const req = { query: { token: 'foo' } };
      const configs = { token: { length: 32 } };
      sanitize(req, {}, configs)
      .then(undesiredRes(done))
      .catch(function(err){
        err.message.should.equal('invalid token length: expected 32, got 3');
        return done();}).catch(done);

    });
  });

  describe('objects', () => it('should stringify invalid values', function(done){
    const req = { query: { foo: [ 123 ] } };

    const configs = {
      foo: {
        generic: 'object'
      }
    };

    sanitize(req, {}, configs)
    .then(undesiredRes(done))
    .catch(function(err){
      err.message.should.equal('invalid foo: [123]');
      return done();}).catch(done);

  }));

  describe('uris', function() {
    it('should reject invalid type', function(done){
      const req = { query: { uris: 1251251 } };
      const configs = { uris: {} };
      sanitize(req, {}, configs)
      .then(undesiredRes(done))
      .catch(function(err){
        err.message.should.equal('invalid uris: expected array, got number');
        return done();}).catch(done);

    });

    it('should reject array including invalid values', function(done){
      const req = { query: { uris: [ 1251251 ] } };
      const configs = { uris: {} };
      sanitize(req, {}, configs)
      .then(undesiredRes(done))
      .catch(function(err){
        err.message.should.startWith('invalid uri: expected uri, got');
        return done();}).catch(done);

    });

    it('should accept uris as an array of strings', function(done){
      const req = { query: { uris: [ 'wd:Q535', 'isbn:9782330056315' ] } };
      const configs = { uris: {} };
      sanitize(req, {}, configs)
      .then(function(input){
        input.uris.should.deepEqual(req.query.uris);
        return done();}).catch(done);

    });

    return it('should accept uris as a pipe separated string', function(done){
      const req = { query: { uris: 'wd:Q535|isbn:9782330056315' } };
      const configs = { uris: {} };
      sanitize(req, {}, configs)
      .then(function(input){
        input.uris.should.deepEqual(req.query.uris.split('|'));
        return done();}).catch(done);

    });
  });

  describe('uri', () => it('should reject invalid type', function(done){
    const req = { query: { uri: 1251251 } };
    const configs = { uri: {} };
    sanitize(req, {}, configs)
    .then(undesiredRes(done))
    .catch(function(err){
      err.message.should.startWith('invalid uri');
      return done();}).catch(done);

  }));

  describe('ids', function() {
    it('should reject invalid type', function(done){
      const req = { query: { ids: 1251251 } };
      const configs = { ids: {} };
      sanitize(req, {}, configs)
      .then(undesiredRes(done))
      .catch(function(err){
        err.message.should.equal('invalid ids: expected array, got number');
        return done();}).catch(done);

    });

    it('should reject array including invalid values', function(done){
      const req = { query: { ids: [ 1251251 ] } };
      const configs = { ids: {} };
      sanitize(req, {}, configs)
      .then(undesiredRes(done))
      .catch(function(err){
        err.message.should.startWith('invalid id: expected id, got');
        return done();}).catch(done);

    });

    it('should deduplicate ids', function(done){
      const id = '5ac0fc497813d9817047e0b89301e502';
      const req = { query: { ids: [ id, id ] } };
      const configs = { ids: {} };
      sanitize(req, {}, configs)
      .then(function(input){
        input.ids.should.deepEqual([ id ]);
        return done();}).catch(done);

    });

    return it('should reject an empty array', function(done){
      const req = { query: { ids: [] } };
      const configs = { ids: {} };
      sanitize(req, {}, configs)
      .then(undesiredRes(done))
      .catch(function(err){
        err.message.should.startWith("ids array can't be empty");
        return done();}).catch(done);

    });
  });

  describe('lang', function() {
    it("should default to 'en'", function(done){
      const req = { query: {} };
      const res = {};
      const configs = { lang: {} };
      sanitize(req, res, configs)
      .then(function(input){
        input.lang.should.equal('en');
        return done();}).catch(done);

    });

    it('should accept a valid lang', function(done){
      const req = { query: { lang: 'fr' } };
      const res = {};
      const configs = { lang: {} };
      sanitize(req, res, configs)
      .then(function(input){
        input.lang.should.equal('fr');
        return done();}).catch(done);

    });

    return it('should reject an invalid lang', function(done){
      const req = { query: { lang: '12512' } };
      const res = {};
      const configs = { lang: {} };
      sanitize(req, res, configs)
      .then(undesiredRes(done))
      .catch(function(err){
        err.message.should.equal('invalid lang: 12512');
        return done();}).catch(done);

    });
  });

  return describe('relatives', function() {
    it('should reject non whitelisted relatives', function(done){
      const req = { query: { relatives: [ 'bar', 'foo' ] } };
      const res = {};
      const configs = { relatives: { whitelist: [ 'bar' ] } };
      sanitize(req, res, configs)
      .catch(function(err){
        err.message.should.startWith('invalid relative');
        return done();}).catch(done);

    });

    return it('should return relatives if whitelisted', function(done){
      const req = { query: { relatives: [ 'bar', 'foo' ] } };
      const res = {};
      const configs = { relatives: { whitelist: [ 'foo', 'bar' ] } };
      sanitize(req, res, configs)
      .then(function(input){
        input.relatives.should.deepEqual([ 'bar', 'foo' ]);
        return done();}).catch(done);

    });
  });
});
