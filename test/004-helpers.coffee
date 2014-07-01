should = require "should"
sinon = require "sinon"

__ = require('./test-utils').path
H = db: require __.helpers 'db'


#UNIT TEST
describe "isValidDbName", ->
  it "blocks unvalid names", (done)->
    H.db.isValidDbName('goodstring').should.be.true
    H.db.isValidDbName('good-string').should.be.true
    H.db.isValidDbName('whatevera-z_$()+-/').should.be.true
    H.db.isValidDbName('BadString').should.be.false
    H.db.isValidDbName('bad string').should.be.false
    done()


#INTEGRATION TEST
describe "checkDbExistanceOrCreate", ->
  it "uses the checker once on valid strings", (done)->
    checker = sinon.spy()
    H.db.checkDbsExistanceOrCreate 'goodstring', checker
    checker.callCount.should.equal 1
    done()

  it "doesn't let ", (done)->
    checker = sinon.spy()
    (->H.db.checkDbsExistanceOrCreate 'badStringWithUppercase', checker).should.throwError
    checker.callCount.should.equal 0
    done()

  it "uses the checker {array.length} times on array", (done)->
    checker = sinon.spy()
    H.db.checkDbsExistanceOrCreate ['abc','efg','hij'], checker
    checker.callCount.should.equal 3
    done()

  it "should throw an error on non-string non-array argument", (done)->
    checker = sinon.spy()
    errorMessage = 'only string and array of strings accepted'
    (->H.db.checkDbsExistanceOrCreate(42, checker)).should.throw errorMessage
    (->H.db.checkDbsExistanceOrCreate({name: 'fakeName'}, checker)).should.throw errorMessage
    checker.callCount.should.equal 0
    done()

  it "should throw an error on non-array-of-string argument", (done)->
    checker = sinon.spy()
    errorMessage = 'only lowercase strings are accepted in an array of DBs'
    (->H.db.checkDbsExistanceOrCreate(['un', 2], checker)).should.throw errorMessage
    (->H.db.checkDbsExistanceOrCreate(['10'], checker)).should.throw errorMessage
    (->H.db.checkDbsExistanceOrCreate(['pastèque'], checker)).should.throw errorMessage
    checker.callCount.should.equal 0
    done()

  it "should throw an error on non-array-of-valid-string argument", (done)->
    checker = sinon.spy()
    (->H.db.checkDbsExistanceOrCreate(['badString1','badString2','badString3'], checker)).should.throw('only lowercase strings are accepted in an array of DBs')
    checker.callCount.should.equal 0
    done()