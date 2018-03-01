CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

should = require 'should'

loginAttemps = __.require 'lib', 'passport/login_attempts'

describe 'loginAttemps', ->
  it 'env', (done)->
    loginAttemps.should.be.an.Object()
    loginAttemps._fails.should.be.a.Function()
    loginAttemps.recordFail.should.be.a.Function()
    loginAttemps.tooMany.should.be.a.Function()
    done()

  loginAttemps._flushFails()
  bobbyAttempt = -> loginAttemps.recordFail('bobby', '*tests*')

  describe 'recordFail', ->
    it "should create username counter if it doesn't exist", (done)->
      should(loginAttemps._fails()['bobby']).not.be.ok()
      bobbyAttempt().should.equal 1
      loginAttemps._fails()['bobby'].should.equal 1
      done()

    it 'should increment username counter', (done)->
      bobbyAttempt().should.equal 2
      bobbyAttempt().should.equal 3
      bobbyAttempt().should.equal 4
      done()

  describe 'tooMany', ->
    it 'should return false when attempts are lower than limit', (done)->
      loginAttemps.tooMany('notabot').should.equal false
      done()

    it 'should return true when attempts are higher or equal to the limit', (done)->
      for i in [1..10]
        loginAttemps.recordFail('notabot')
        _.log loginAttemps.tooMany('notabot')
      loginAttemps.tooMany('notabot').should.equal true
      done()
