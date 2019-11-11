/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');

const should = require('should');
const slugify = __.require('controllers', 'groups/lib/slugify');

describe('slugify', function() {
  it('should be a function', function(done){
    slugify.should.be.a.Function();
    return done();
  });

  it('should take a string and return a string', function(done){
    slugify('bla').should.be.a.String();
    slugify('bla&mémùémd ùdém^&²Mdù é:azdza').should.be.a.String();
    return done();
  });

  it('should replace URL reserved characters', function(done){
    slugify("L:a;:? M[!Y]$'@,\"|N=.E - é<(h)>o").should.equal('la-myn-e-ého');
    return done();
  });

  it('should preserve non-ASCII characters', function(done){
    slugify('『青チョークの男』').should.equal('『青チョークの男』');
    return done();
  });

  return it('should drop dashes at the extremities', function(done){
    slugify('-hello-').should.equal('hello');
    slugify('?hello?').should.equal('hello');
    return done();
  });
});
