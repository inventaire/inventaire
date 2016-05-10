CONFIG = require('config')
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

should = require 'should'

User = __.require 'models', 'user'


_create = (args)-> User._create.apply null, args
create = (args)-> User.create.apply null, args

validUser = -> [
    'rocky4'
    'hi@validemail.org'
    'local'
    'se'
    'password'
  ]

replaceParam = (index, value, baseArgGen=validUser)->
  args = baseArgGen()
  args[index] = value
  return _.log args, 'args'



describe 'user model', ->
  describe 'creation strategy', ->
    it "should throw on missing strategy", (done)->
      args = replaceParam 2, null
      (-> _create(args)).should.throw()
      done()

    it "should throw on invalid strategy", (done)->
      args = replaceParam 2, 'flower!'
      (-> _create(args)).should.throw()
      done()

  describe 'local signup', ->
    it "should return a user on valid args", (done)->
      user = create validUser()
      user.should.be.an.Object()
      done()

    describe 'username validation', ->
      it "should throw on empty username", (done)->
        args = replaceParam 0, ''
        (-> _create(args)).should.throw()
        done()

      it "should throw on username with space", (done)->
        args = replaceParam 0, 'with space'
        (-> _create(args)).should.throw()
        done()

      it "should throw on username with special characters", (done)->
        args = replaceParam 0, 'with$special%characters'
        (-> _create(args)).should.throw()
        done()

    describe 'email validation', ->
      it "should throw on invalid email", (done)->
        args = replaceParam 1, 'notanemail'
        (-> _create(args)).should.throw()
        done()

      it "should throw on missing domain", (done)->
        args = replaceParam 1, 'morelike@anemailbutno'
        (-> _create(args)).should.throw()
        done()

    describe 'language validation', ->
      it "should throw on invalid language", (done)->
        args = replaceParam 3, 'badlang'
        (-> _create(args)).should.throw()
        done()

      it "should not throw on missing language", (done)->
        args = replaceParam 3, undefined
        (-> _create(args)).should.not.throw()
        done()

    describe 'password validation', ->
      it "should throw on passwords too short", (done)->
        args = replaceParam 4, 'shortpw'
        (-> _create(args)).should.throw()
        done()

      it "should throw on passwords too long", (done)->
        tooLongPassword = [0..10].join('hello')
        args = replaceParam 4, tooLongPassword
        (-> _create(args)).should.throw()
        done()

      # Valid test but takes too much time due to the hash
      # Can be let comment-out when not working on this part of the code

      # it "should return a hashed password", (done)->
      #   args = validUser()
      #   clearPassword = args[4]

      #   _.info 'takes more time due to the volontarly slow hash function'
      #   @timeout 5000

      #   create validUser()
      #   .then (user)->
      #     user.password.should.be.a.String()
      #     _.log clearPassword, 'input'
      #     _.log user.password, 'output'
      #     user.password.should.not.equal clearPassword
      #     user.password.length.should.be.above 200
      #     done()
      #   .catch (err)-> console.log 'err', err
