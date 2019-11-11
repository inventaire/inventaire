/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath;
const _ = __.require('builders', 'utils');
const should = require('should');

describe('utils', function() {
  describe('env', () => it('should have loggers, boolean validations, and misc utils', function(done){
    _.Log.should.be.a.Function();
    _.isLocalImg.should.be.a.Function();
    _.hashCode.should.be.a.Function();
    return done();
  }));

  describe('hashCode', () => it('should return a hash', function(done){
    _.hashCode('whatever').should.be.a.Number();
    return done();
  }));

  describe('flattenIndexes', function() {
    it('should return the collection of indexes merged into one', function(done){
      _.flattenIndexes.should.be.a.Function();
      const indexes = [ { a: 1 }, { b: 2 }, { c: 3 }, { a: 4, d: 5 } ];
      const result = _.flattenIndexes(indexes);
      result.should.be.an.Object();
      result.a.should.equal(4);
      result.b.should.equal(2);
      result.c.should.equal(3);
      result.d.should.equal(5);
      Object.keys(result).length.should.equal(4);
      return done();
    });

    return it('should return a new index without modifiy the passed indexes', function(done){
      const indexA = { a: 1 };
      const indexB = { b: 2 };
      const indexC = { c: 3 };
      const indexD = { a: 4, d: 5 };
      const indexes = [ indexA, indexB, indexC, indexD ];
      const result = _.flattenIndexes(indexes);
      result.should.not.equal(indexA);
      result.should.not.equal(indexB);
      result.should.not.equal(indexC);
      result.should.not.equal(indexD);
      return done();
    });
  });

  describe('buildPath', function() {
    it('should return a string with parameters', function(done){
      const path = _.buildPath('/api', { action: 'man' });
      path.should.be.a.String();
      path.should.equal('/api?action=man');
      return done();
    });

    it('should not add empty parameters', function(done){
      const path = _.buildPath('/api', { action: 'man', boudu: null });
      path.should.equal('/api?action=man');
      return done();
    });

    it('should stringify object value', function(done){
      const path = _.buildPath('/api', { action: 'man', data: { a: [ 'abc', 2 ] } });
      path.should.equal('/api?action=man&data={"a":["abc",2]}');
      return done();
    });

    return it('should URI encode object values problematic query string characters', function(done){
      const data = { a: 'some string with ?!MM%** problematic characters' };
      const path = _.buildPath('/api', { data });
      path.should.equal('/api?data={"a":"some string with %3F!MM%** problematic characters"}');
      return done();
    });
  });

  describe('typeOf', () => it('should return the right type', function(done){
    _.typeOf('hello').should.equal('string');
    _.typeOf([ 'hello' ]).should.equal('array');
    _.typeOf({ hel:'lo' }).should.equal('object');
    _.typeOf(83110).should.equal('number');
    _.typeOf(null).should.equal('null');
    _.typeOf().should.equal('undefined');
    _.typeOf(false).should.equal('boolean');
    _.typeOf(Number('boudu')).should.equal('NaN');
    return done();
  }));

  describe('forceArray', function(done){
    it('should return an array for an array', function(done){
      const a = _.forceArray([ 1, 2, 3, { zo: 'hello' }, null ]);
      a.should.be.an.Array();
      a.length.should.equal(5);
      return done();
    });

    it('should return an array for a string', function(done){
      const a = _.forceArray('yolo');
      a.should.be.an.Array();
      a.length.should.equal(1);
      return done();
    });

    it('should return an array for a number', function(done){
      const a = _.forceArray(125);
      a.should.be.an.Array();
      a.length.should.equal(1);
      const b = _.forceArray(-12612125);
      b.should.be.an.Array();
      b.length.should.equal(1);
      return done();
    });

    it('should return an array for an object', function(done){
      const a = _.forceArray({ bon: 'jour' });
      a.should.be.an.Array();
      a.length.should.equal(1);
      return done();
    });

    it('should return an empty array for null', function(done){
      const a = _.forceArray(null);
      a.should.be.an.Array();
      a.length.should.equal(0);
      return done();
    });

    it('should return an empty array for undefined', function(done){
      const a = _.forceArray(null);
      a.should.be.an.Array();
      a.length.should.equal(0);
      return done();
    });

    it('should return an empty array for an empty input', function(done){
      const a = _.forceArray();
      a.should.be.an.Array();
      a.length.should.equal(0);
      return done();
    });

    return it('should return an empty array for an empty string', function(done){
      const a = _.forceArray('');
      a.should.be.an.Array();
      a.length.should.equal(0);
      return done();
    });
  });

  return describe('mapKeysValues', function() {
    it('should return a new object', function(done){
      const obj = { a: 1, b: 2 };
      const fn = (key, value) => [ key, value ];
      const newObj = _.mapKeysValues(obj, fn);
      newObj.should.be.an.Object();
      newObj.should.not.equal(obj);
      return done();
    });

    return it('should return new keys and values', function(done){
      const obj = { a: 1, b: 2 };
      const fn = (key, value) => [ key + key, value + value ];
      _.mapKeysValues(obj, fn).should.deepEqual({ aa: 2, bb: 4 });
      return done();
    });
  });
});
