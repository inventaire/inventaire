/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');

const should = require('should');

const User = __.require('models', 'user');

const _create = args => User._create.apply(null, args);
const create = args => User.create.apply(null, args);

const validUser = () => [
    'rocky4',
    'hi@validemail.org',
    'local',
    'se',
    'password'
  ];

const replaceParam = function(index, value, baseArgGen = validUser){
  const args = baseArgGen();
  args[index] = value;
  return _.log(args, 'args');
};

describe('user model', function() {
  describe('creation strategy', function() {
    it('should throw on missing strategy', function(done){
      const args = replaceParam(2, null);
      ((() => _create(args))).should.throw();
      return done();
    });

    return it('should throw on invalid strategy', function(done){
      const args = replaceParam(2, 'flower!');
      ((() => _create(args))).should.throw();
      return done();
    });
  });

  return describe('local signup', function() {
    it('should return a user on valid args', function(done){
      const user = create(validUser());
      user.should.be.an.Object();
      return done();
    });

    describe('username validation', function() {
      it('should throw on empty username', function(done){
        const args = replaceParam(0, '');
        ((() => _create(args))).should.throw();
        return done();
      });

      it('should throw on username with space', function(done){
        const args = replaceParam(0, 'with space');
        ((() => _create(args))).should.throw();
        return done();
      });

      return it('should throw on username with special characters', function(done){
        const args = replaceParam(0, 'with$special%characters');
        ((() => _create(args))).should.throw();
        return done();
      });
    });

    describe('email validation', function() {
      it('should throw on invalid email', function(done){
        const args = replaceParam(1, 'notanemail');
        ((() => _create(args))).should.throw();
        return done();
      });

      return it('should throw on missing domain', function(done){
        const args = replaceParam(1, 'morelike@anemailbutno');
        ((() => _create(args))).should.throw();
        return done();
      });
    });

    describe('language validation', function() {
      it('should throw on invalid language', function(done){
        const args = replaceParam(3, 'badlang');
        ((() => _create(args))).should.throw();
        return done();
      });

      return it('should not throw on missing language', function(done){
        const args = replaceParam(3, undefined);
        ((() => _create(args))).should.not.throw();
        return done();
      });
    });

    return describe('password validation', function() {
      it('should throw on passwords too short', function(done){
        const args = replaceParam(4, 'shortpw');
        ((() => _create(args))).should.throw();
        return done();
      });

      return it('should throw on passwords too long', function(done){
        const tooLongPassword = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].join('hellohellohello');
        const args = replaceParam(4, tooLongPassword);
        ((() => _create(args))).should.throw();
        return done();
      });
    });
  });
});

      // Valid test but takes too much time due to the hash
      // Can be let comment-out when not working on this part of the code

      // it 'should return a hashed password', (done)->
      //   args = validUser()
      //   clearPassword = args[4]

      //   _.info 'takes more time due to the volontarly slow hash function'
      //   @timeout 5000

      //   create validUser()
      //   .then (user)->
      //     user.password.should.be.a.String()
      //     _.log clearPassword, 'input'
      //     _.log user.password, 'output'
      //     user.password.should.not.equal clearPassword
      //     user.password.length.should.be.above 200
      //     done()
      //   .catch (err)-> console.log 'err', err
