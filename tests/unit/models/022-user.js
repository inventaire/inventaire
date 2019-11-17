// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')

require('should')

const User = __.require('models', 'user')

const _create = args => User._create.apply(null, args)
const create = args => User.create.apply(null, args)

const validUser = () => [
  'rocky4',
  'hi@validemail.org',
  'local',
  'se',
  'password'
]

const replaceParam = (index, value, baseArgGen = validUser) => {
  const args = baseArgGen()
  args[index] = value
  return _.log(args, 'args')
}

describe('user model', () => {
  describe('creation strategy', () => {
    it('should throw on missing strategy', done => {
      const args = replaceParam(2, null);
      ((() => _create(args))).should.throw()
      done()
    })

    it('should throw on invalid strategy', done => {
      const args = replaceParam(2, 'flower!');
      ((() => _create(args))).should.throw()
      done()
    })
  })

  describe('local signup', () => {
    it('should return a user on valid args', done => {
      const user = create(validUser())
      user.should.be.an.Object()
      done()
    })

    describe('username validation', () => {
      it('should throw on empty username', done => {
        const args = replaceParam(0, '');
        ((() => _create(args))).should.throw()
        done()
      })

      it('should throw on username with space', done => {
        const args = replaceParam(0, 'with space');
        ((() => _create(args))).should.throw()
        done()
      })

      it('should throw on username with special characters', done => {
        const args = replaceParam(0, 'with$special%characters');
        ((() => _create(args))).should.throw()
        done()
      })
    })

    describe('email validation', () => {
      it('should throw on invalid email', done => {
        const args = replaceParam(1, 'notanemail');
        ((() => _create(args))).should.throw()
        done()
      })

      it('should throw on missing domain', done => {
        const args = replaceParam(1, 'morelike@anemailbutno');
        ((() => _create(args))).should.throw()
        done()
      })
    })

    describe('language validation', () => {
      it('should throw on invalid language', done => {
        const args = replaceParam(3, 'badlang');
        ((() => _create(args))).should.throw()
        done()
      })

      it('should not throw on missing language', done => {
        const args = replaceParam(3, undefined);
        ((() => _create(args))).should.not.throw()
        done()
      })
    })

    describe('password validation', () => {
      it('should throw on passwords too short', done => {
        const args = replaceParam(4, 'shortpw');
        ((() => _create(args))).should.throw()
        done()
      })

      it('should throw on passwords too long', done => {
        const tooLongPassword = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ].join('hellohellohello')
        const args = replaceParam(4, tooLongPassword);
        ((() => _create(args))).should.throw()
        done()
      })
    })
  })
})

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
