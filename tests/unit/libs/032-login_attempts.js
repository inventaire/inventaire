const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')

const should = require('should')

const loginAttemps = __.require('lib', 'passport/login_attempts')

describe('loginAttemps', () => {
  it('env', () => {
    loginAttemps.should.be.an.Object()
    loginAttemps._fails.should.be.a.Function()
    loginAttemps.recordFail.should.be.a.Function()
    loginAttemps.tooMany.should.be.a.Function()
  })

  loginAttemps._flushFails()
  const bobbyAttempt = () => loginAttemps.recordFail('bobby', '*tests*')

  describe('recordFail', () => {
    it("should create username counter if it doesn't exist", () => {
      should(loginAttemps._fails().bobby).not.be.ok()
      bobbyAttempt().should.equal(1)
      loginAttemps._fails().bobby.should.equal(1)
    })

    it('should increment username counter', () => {
      bobbyAttempt().should.equal(2)
      bobbyAttempt().should.equal(3)
      bobbyAttempt().should.equal(4)
    })
  })

  describe('tooMany', () => {
    it('should return false when attempts are lower than limit', () => {
      loginAttemps.tooMany('notabot').should.be.false()
    })

    it('should return true when attempts are higher or equal to the limit', () => {
      for (let i = 1; i <= 10; i++) {
        loginAttemps.recordFail('notabot')
        _.log(loginAttemps.tooMany('notabot'))
      }
      loginAttemps.tooMany('notabot').should.be.true()
    })
  })
})
