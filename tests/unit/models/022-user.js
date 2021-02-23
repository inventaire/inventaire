const _ = require('builders/utils')
const should = require('should')

const User = require('models/user')

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
    it('should throw on missing strategy', () => {
      const args = replaceParam(2, null);
      (() => _create(args)).should.throw()
    })

    it('should throw on invalid strategy', () => {
      const args = replaceParam(2, 'flower!');
      (() => _create(args)).should.throw()
    })
  })

  describe('local signup', () => {
    it('should return a user on valid args', () => {
      const user = create(validUser())
      user.should.be.an.Object()
    })

    describe('username validation', () => {
      it('should throw on empty username', () => {
        const args = replaceParam(0, '');
        (() => _create(args)).should.throw()
      })

      it('should throw on username with space', () => {
        const args = replaceParam(0, 'with space');
        (() => _create(args)).should.throw()
      })

      it('should throw on username with special characters', () => {
        const args = replaceParam(0, 'with$special%characters');
        (() => _create(args)).should.throw()
      })
    })

    describe('email validation', () => {
      it('should throw on invalid email', () => {
        const args = replaceParam(1, 'notanemail');
        (() => _create(args)).should.throw()
      })

      it('should throw on missing domain', () => {
        const args = replaceParam(1, 'morelike@anemailbutno');
        (() => _create(args)).should.throw()
      })
    })

    describe('language validation', () => {
      it('should throw on invalid language', () => {
        const args = replaceParam(3, 'badlang');
        (() => _create(args)).should.throw()
      })

      it('should not throw on missing language', () => {
        const args = replaceParam(3, undefined);
        (() => _create(args)).should.not.throw()
      })
    })

    describe('password validation', () => {
      it('should throw on passwords too short', () => {
        const args = replaceParam(4, 'shortpw');
        (() => _create(args)).should.throw()
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

  describe('addRole', () => {
    it('should add a first role', () => {
      const user = _create(validUser())
      should(user.roles).not.be.ok()
      User.addRole('admin')(user)
      user.roles.should.deepEqual([ 'admin' ])
    })

    it('should add a new role', () => {
      const user = _create(validUser())
      User.addRole('admin')(user)
      User.addRole('dataadmin')(user)
      user.roles.should.deepEqual([ 'admin', 'dataadmin' ])
    })

    it('should not add a duplicated role', () => {
      const user = _create(validUser())
      User.addRole('admin')(user);
      (() => User.addRole('admin')(user)).should.throw()
    })

    it('should reject an invalid role', () => {
      const user = _create(validUser());
      (() => User.addRole('foo')(user)).should.throw()
    })
  })

  describe('removeRole', () => {
    it('should remove role', () => {
      const user = _create(validUser())
      User.addRole('admin')(user)
      User.addRole('dataadmin')(user)
      User.removeRole('dataadmin')(user)
      user.roles.should.deepEqual([ 'admin' ])
    })

    it('should reject an invalid role', () => {
      const user = _create(validUser());
      (() => User.addRole('foo')(user)).should.throw()
    })
  })

  describe('addKeyPair', () => {
    it('should add a public key and a private key', () => {
      const user = _create(validUser())
      should(user.publicKey).not.be.ok()
      should(user.privateKey).not.be.ok()
      User.addKeyPair({ publicKey: 'foo', privateKey: 'bar' })(user)
      user.publicKey.should.deepEqual('foo')
      user.privateKey.should.deepEqual('bar')
    })
  })
})
