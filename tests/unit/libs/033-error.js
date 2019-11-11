/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath;
const _ = __.require('builders', 'utils');

const should = require('should');

const error_ = __.require('lib', 'error/error');

describe('error_', function() {
  describe('new', function() {
    it('should return an Error object', function(done){
      const err = error_.new('doh', 500);
      err.should.be.an.Object();
      (err instanceof Error).should.be.true();
      return done();
    });

    it('should have a message property', function(done){
      const err = error_.new('doh', 500);
      err.message.should.equal('doh');
      return done();
    });

    it('should convert a number filter into a status code', function(done){
      const err = error_.new('doh', 456);
      err.statusCode.should.equal(456);
      should(err.type).not.be.ok();
      return done();
    });

    it('should convert a string filter into an error type', function(done){
      const err = error_.new('doh', 'pinaiz');
      err.type.should.equal('pinaiz');
      should(err.statusCode).not.be.ok();
      return done();
    });

    return it('should pass following arguments as an array of context', function(done){
      const err = error_.new('doh', 'pinaiz', 'pizza', 'macharoni');
      err.type.should.equal('pinaiz');
      should(err.statusCode).not.be.ok();
      err.context.should.be.an.Array();
      err.context.length.should.equal(2);
      err.context[0].should.equal('pizza');
      err.context[1].should.equal('macharoni');
      return done();
    });
  });

  describe('ErrorHandler', () => it('should return a function', function(done){
    error_.handler.should.be.a.Function();
    error_.Handler.should.be.a.Function();
    error_.Handler('yo').should.be.a.Function();
    return done();
  }));

  return describe('reject', function() {
    it('should return a rejecting promise from a string', function(done){
      const failed = error_.reject('doh', 500);
      failed.should.be.an.Object();
      failed.then.should.be.a.Function();
      failed.catch(function(err){
        err.message.should.equal('doh');
        err.statusCode.should.equal(500);
        return done();
      });

    });

    return it('should return a rejecting promise from an error object', function(done){
      error_.reject(new Error('doh'), 500)
      .catch(function(err){
        err.message.should.equal('doh');
        return done();
      });

    });
  });
});
