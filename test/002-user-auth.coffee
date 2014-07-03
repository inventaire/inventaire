expect = require("chai").expect
should = require "should"
trycatch = require "trycatch"
request = require "supertest"
baseUrl = require('config').fullHost()
__ = require('./test-utils').path
_ = require __.helpers 'utils'
user = require __.helpers 'user'

# UNIT TESTS
describe "username validation", ->
  before ->
    _.logGreen fake.good, 'creating fake user'
    user.newUser fake.good.username, fake.good.email

  it "doesn't let in invalid characters", (done)->
    trycatch( ->
      user.nameIsValid('PerfectLyOKName').should.be.true
      user.nameIsValid('1210pasteque').should.be.true
      user.nameIsValid('Badname due to spaces').should.be.false
      user.nameIsValid('specialChar**cters').should.be.false
      user.nameIsValid('').should.be.false
      user.nameIsValid('UsernameHasMoreThan20character').should.be.false
      done()
    , done)

# INTEGRATION TESTS
  it 'returns a confirmation when valid', (done)->
    trycatch( ->
      request(baseUrl)
        .post '/auth/username'
        .send fake.good
        .end (err, res) ->
          res.status.should.equal 200
          res.body.should.be.an.Object
          res.body.should.have.property('username')
          res.body.status.should.equal 'available'
          done()
    , done)

  it 'returns an invalid status when invalid username', (done)->
    trycatch( ->
      request(baseUrl)
        .post '/auth/username'
        .send fake.invalid
        .end (err, res) ->
          res.status.should.equal 400
          res.body.should.be.an.Object
          res.body.should.have.property('username')
          res.body.should.have.property('status')
          res.body.status.should.equal 'invalid'
          done()
    , done)

  it 'returns a not available status when not available username', (done)->
    trycatch( ->
      request(baseUrl)
        .post '/auth/username'
        .send fake.taken
        .end (err, res) ->
          res.status.should.equal 400
          res.body.should.be.an.Object
          res.body.should.have.property('username')
          res.body.should.have.property('status')
          res.body.status.should.equal 'not available'
          done()
    , done)



fake =
  good:
    username: "validNewUserName"
    email: "user@zombo.com"
  invalid:
    username: "Invalid*name"
  taken:
    username: "validnewusername"
