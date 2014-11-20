should = require "should"
sinon = require "sinon"

__ = require('config').root
_ = __.require 'builders', 'utils'

couchHandler = __.require 'db', 'couch_handler'

#UNIT TEST
describe "isValidDbName", ->
  it "blocks unvalid names", (done)->
    couchHandler.isValidDbName('goodstring').should.be.true
    couchHandler.isValidDbName('good-string').should.be.true
    couchHandler.isValidDbName('whatevera-z_$()+-/').should.be.true
    couchHandler.isValidDbName('BadString').should.be.false
    couchHandler.isValidDbName('bad string').should.be.false
    done()


#INTEGRATION TEST
describe "checkDbExistanceOrCreate", ->
  it "uses the checker once on valid strings", (done)->
    checker = sinon.spy()
    couchHandler.checkDbsExistanceOrCreate 'goodstring', checker
    checker.callCount.should.equal 1
    done()

  it "doesn't let ", (done)->
    checker = sinon.spy()
    (->couchHandler.checkDbsExistanceOrCreate 'badStringWithUppercase', checker).should.throwError
    checker.callCount.should.equal 0
    done()

  it "uses the checker {array.length} times on array", (done)->
    checker = sinon.spy()
    couchHandler.checkDbsExistanceOrCreate ['abc','efg','hij'], checker
    checker.callCount.should.equal 3
    done()

  it "should throw an error on non-string non-array argument", (done)->
    checker = sinon.spy()
    errorMessage = 'only string and array of strings accepted'
    (->couchHandler.checkDbsExistanceOrCreate(42, checker)).should.throw errorMessage
    (->couchHandler.checkDbsExistanceOrCreate({name: 'fakeName'}, checker)).should.throw errorMessage
    checker.callCount.should.equal 0
    done()

  it "should throw an error on non-array-of-string argument", (done)->
    checker = sinon.spy()
    errorMessage = 'only lowercase strings are accepted in an array of DBs'
    (->couchHandler.checkDbsExistanceOrCreate(['un', 2], checker)).should.throw errorMessage
    (->couchHandler.checkDbsExistanceOrCreate(['10'], checker)).should.throw errorMessage
    (->couchHandler.checkDbsExistanceOrCreate(['pastèque'], checker)).should.throw errorMessage
    checker.callCount.should.equal 0
    done()

  it "should throw an error on non-array-of-valid-string argument", (done)->
    checker = sinon.spy()
    (->couchHandler.checkDbsExistanceOrCreate(['badString1','badString2','badString3'], checker)).should.throw('only lowercase strings are accepted in an array of DBs')
    checker.callCount.should.equal 0
    done()

