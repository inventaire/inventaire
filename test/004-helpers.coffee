should = require "should"
sinon = require "sinon"

__ = require('./test-utils').path
H = db: require __.helpers + 'db'


describe "checkDbExistanceOrCreate", ->
  it "uses the checker once on strings", (done)->
    checker = sinon.spy()
    H.db.checkDbsExistanceOrCreate 'fakeString', checker
    checker.callCount.should.equal 1
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
    done()

  it "should throw an error on non-string or non-array-of-string argument", (done)->
    checker = sinon.spy()
    (->H.db.checkDbsExistanceOrCreate(['1', 2, '10', 'pastèque'], checker)).should.throw('only lowercase strings are accepted in an array of DBs')
    done()

  it "should throw an error on non-array-of-valid-string argument", (done)->
    checker = sinon.spy()
    (->H.db.checkDbsExistanceOrCreate(['badString1','badString2','badString3'], checker)).should.throw('only lowercase strings are accepted in an array of DBs')
    done()

  # it "uses the single Method on array", (done)->
  #   # H.db.checkDbExistanceOrCreate 'fakeString'
  #   callback = sinon.spy()
  #   callback()
  #   callback.called.should.be.true
  #   done()

