const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const should = require('should')

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
      (() => _create(args)).should.throw()
      done()
    })

    it('should throw on invalid strategy', done => {
      const args = replaceParam(2, 'flower!');
      (() => _create(args)).should.throw()
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
        (() => _create(args)).should.throw()
        done()
      })

      it('should throw on username with space', done => {
        const args = replaceParam(0, 'with space');
        (() => _create(args)).should.throw()
        done()
      })

      it('should throw on username with special characters', done => {
        const args = replaceParam(0, 'with$special%characters');
        (() => _create(args)).should.throw()
        done()
      })
    })

    describe('email validation', () => {
      it('should throw on invalid email', done => {
        const args = replaceParam(1, 'notanemail');
        (() => _create(args)).should.throw()
        done()
      })

      it('should throw on missing domain', done => {
        const args = replaceParam(1, 'morelike@anemailbutno');
        (() => _create(args)).should.throw()
        done()
      })
    })

    describe('language validation', () => {
      it('should throw on invalid language', done => {
        const args = replaceParam(3, 'badlang');
        (() => _create(args)).should.throw()
        done()
      })

      it('should not throw on missing language', done => {
        const args = replaceParam(3, undefined);
        (() => _create(args)).should.not.throw()
        done()
      })
    })

    describe('password validation', () => {
      it('should throw on passwords too short', done => {
        const args = replaceParam(4, 'shortpw');
        (() => _create(args)).should.throw()
        done()
      })
    })
  })

  describe('delete', () => {
    it('should delete user attributes not needed by the user souvenir', () => {
      const user = _create(validUser())
      user._id = user._rev = 'foo'
      const userSouvenir = User.softDelete(user)
      userSouvenir.should.deepEqual({
        _id: user._id,
        _rev: user._rev,
        username: user.username,
        type: 'deletedUser'
      })
    })
  })

  describe('updateItemsCounts', () => {
    const counts = {
      private: { 'items:count': 1 },
      network: { 'items:count': 2 },
      public: { 'items:count': 3 }
    }

    it('should update items counts', () => {
      const user = _create(validUser())
      const updatedUser = User.updateItemsCounts(counts)(user)
      updatedUser.snapshot.should.deepEqual(counts)
    })

    // This especially needs to be tested as it might happen that a debounced event
    // make User.updateItemsCounts be called after a user was deleted
    it('should not throw if the user was deleted', () => {
      const user = _create(validUser())
      const userSouvenir = User.softDelete(user)
      const updatedUser = User.updateItemsCounts(counts)(userSouvenir)
      updatedUser.should.equal(userSouvenir)
      should(updatedUser.snapshot).not.be.ok()
    })
  })
})
