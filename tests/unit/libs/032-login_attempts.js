/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');

const should = require('should');

const loginAttemps = __.require('lib', 'passport/login_attempts');

describe('loginAttemps', function() {
  it('env', function(done){
    loginAttemps.should.be.an.Object();
    loginAttemps._fails.should.be.a.Function();
    loginAttemps.recordFail.should.be.a.Function();
    loginAttemps.tooMany.should.be.a.Function();
    return done();
  });

  loginAttemps._flushFails();
  const bobbyAttempt = () => loginAttemps.recordFail('bobby', '*tests*');

  describe('recordFail', function() {
    it("should create username counter if it doesn't exist", function(done){
      should(loginAttemps._fails()['bobby']).not.be.ok();
      bobbyAttempt().should.equal(1);
      loginAttemps._fails()['bobby'].should.equal(1);
      return done();
    });

    return it('should increment username counter', function(done){
      bobbyAttempt().should.equal(2);
      bobbyAttempt().should.equal(3);
      bobbyAttempt().should.equal(4);
      return done();
    });
  });

  return describe('tooMany', function() {
    it('should return false when attempts are lower than limit', function(done){
      loginAttemps.tooMany('notabot').should.be.false();
      return done();
    });

    return it('should return true when attempts are higher or equal to the limit', function(done){
      for (let i = 1; i <= 10; i++) {
        loginAttemps.recordFail('notabot');
        _.log(loginAttemps.tooMany('notabot'));
      }
      loginAttemps.tooMany('notabot').should.be.true();
      return done();
    });
  });
});
