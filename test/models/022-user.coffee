CONFIG = require('config')
__ = CONFIG.root
_ = __.require 'builders', 'utils'

should = require 'should'
expect = require("chai").expect

User = __.require 'models', 'user'


create = (args)-> User.create.apply null, args

validUser = -> [
    'rocky4'
    'hi@validemail.org'
    'local'
    'se'
    'password'
  ]

browseridBaseArgs = -> [
    'rocky4'
    'hi@validemail.org'
    'browserid'
    'se'
  ]

replaceParam = (index, value, baseArgGen=validUser)->
  args = baseArgGen()
  args[index] = value
  return _.log args, 'args'



describe 'user model', ->
  describe 'creation strategy', ->
    it "should throw on missing strategy", (done)->
      args = replaceParam 2, null
      create(args)
      .catch (err)->
        # _.error(err, 'err')
        done()

    it "should throw on invalid strategy", (done)->
      args = replaceParam 2, 'flower!'
      create(args)
      .catch (err)->
        # _.error(err, 'err')
        done()

  describe 'local signup', ->
    it "should return a user on valid args", (done)->
      create(validUser())
      .then (res)->
        res.should.be.an.Object
        done()

    describe 'username validation', ->
      it "should throw on empty username", (done)->
        args = replaceParam 0, ''
        create(args)
        .catch (err)->
          # _.error(err, 'err')
          done()
      it "should throw on username with space", (done)->
        args = replaceParam 0, 'with space'
        create(args)
        .catch (err)->
          # _.error(err, 'err')
          done()
      it "should throw on username with special characters", (done)->
        args = replaceParam 0, 'with$special%characters'
        create(args)
        .catch (err)->
          # _.error(err, 'err')
          done()

    describe 'email validation', ->
      it "should throw on invalid email", (done)->
        args = replaceParam 1, 'notanemail'
        create(args)
        .catch (err)->
          # _.error(err, 'err')
          done()
      it "should throw on missing domain", (done)->
        args = replaceParam 1, 'morelike@anemailbutno'
        create(args)
        .catch (err)->
          # _.error(err, 'err')
          done()

    describe 'language validation', ->
      it "should throw on invalid language", (done)->
        args = replaceParam 3, 'badlang'
        create(args)
        .catch (err)->
          # _.error(err, 'err')
          done()

      it "should not throw on missing language", (done)->
        args = replaceParam 3, undefined
        create(args)
        .then -> done()

    describe 'password validation', ->
      it "should throw on passwords too short", (done)->
        args = replaceParam 4, 'shortpw'
        create(args)
        .catch (err)->
          # _.error(err, 'err')
          done()
      it "should throw on passwords too long", (done)->
        tooLongPassword = [0..10].join('hello')
        args = replaceParam 4, tooLongPassword
        create(args)
        .catch (err)->
          # _.error(err, 'err')
          done()
      it "should return a hashed password", (done)->
        args = validUser()
        clearPassword = args[4]
        create(validUser())
        .then (user)->
          user.password.should.be.a.String
          _.log clearPassword, 'input'
          _.log user.password, 'output'
          user.password.should.not.equal clearPassword
          user.password.length.should.be.above 200
          done()

  describe 'browserid signup', ->
    it "should accept browserid strategy", (done)->
      args = browseridBaseArgs()
      create(args)
      .then (user)->
        _.log user, 'user'
        user.should.an.Object
        user.creationStrategy.should.equal 'browserid'
        done()

    it "should not throw on missing password", (done)->
      args = browseridBaseArgs()
      create(args)
      .then (user)->
        user.should.an.Object
        expect(user.password).to.equal undefined
        done()

    it "should throw on existing password", (done)->
      args = browseridBaseArgs()
      args.push('password')
      create(args)
      .catch (err)->
        # _.error(err, 'err')
        done()

    it "should throw on bad username", (done)->
      args = replaceParam 0, '', browseridBaseArgs
      create(args)
      .catch (err)->
        # _.error(err, 'err')
        done()

    it "should throw on bad email", (done)->
      args = replaceParam 1, '', browseridBaseArgs
      create(args)
      .catch (err)->
        # _.error(err, 'err')
        done()
