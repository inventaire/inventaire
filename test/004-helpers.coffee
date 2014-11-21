should = require "should"
sinon = require "sinon"

__ = require('config').root
_ = __.require 'builders', 'utils'

couch_ = __.require 'db', 'couch_handler'

#UNIT TEST
describe "isValidDbName", ->
  it "blocks unvalid names", (done)->
    couch_.isValidDbName('goodstring').should.be.true
    couch_.isValidDbName('good-string').should.be.true
    couch_.isValidDbName('whatevera-z_$()+-/').should.be.true
    couch_.isValidDbName('BadString').should.be.false
    couch_.isValidDbName('bad string').should.be.false
    done()


#INTEGRATION TEST
describe "checkDbExistanceOrCreate", ->
  it "uses the checker once on valid strings", (done)->
    checker = sinon.spy()
    couch_.checkDbsExistanceOrCreate 'goodstring', checker
    checker.callCount.should.equal 1
    done()

  it "doesn't let ", (done)->
    checker = sinon.spy()
    (->couch_.checkDbsExistanceOrCreate 'badStringWithUppercase', checker).should.throwError
    checker.callCount.should.equal 0
    done()

  it "uses the checker {array.length} times on array", (done)->
    checker = sinon.spy()
    couch_.checkDbsExistanceOrCreate ['abc','efg','hij'], checker
    checker.callCount.should.equal 3
    done()

  it "should throw an error on non-string non-array argument", (done)->
    checker = sinon.spy()
    errorMessage = 'only string and array of strings accepted'
    (->couch_.checkDbsExistanceOrCreate(42, checker)).should.throw errorMessage
    (->couch_.checkDbsExistanceOrCreate({name: 'fakeName'}, checker)).should.throw errorMessage
    checker.callCount.should.equal 0
    done()

  it "should throw an error on non-array-of-string argument", (done)->
    checker = sinon.spy()
    errorMessage = 'only lowercase strings are accepted in an array of DBs'
    (->couch_.checkDbsExistanceOrCreate(['un', 2], checker)).should.throw errorMessage
    (->couch_.checkDbsExistanceOrCreate(['10'], checker)).should.throw errorMessage
    (->couch_.checkDbsExistanceOrCreate(['pastèque'], checker)).should.throw errorMessage
    checker.callCount.should.equal 0
    done()

  it "should throw an error on non-array-of-valid-string argument", (done)->
    checker = sinon.spy()
    (->couch_.checkDbsExistanceOrCreate(['badString1','badString2','badString3'], checker)).should.throw('only lowercase strings are accepted in an array of DBs')
    checker.callCount.should.equal 0
    done()

