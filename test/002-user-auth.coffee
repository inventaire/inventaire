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


describe "username creation", ->

  after ->
    user.deleteUserByUsername fake.good.username

  it 'returns a standard user row', (done)->
    trycatch( ->
      user.newUser(fake.good.username, fake.good.email)
      .done (body)->
        body.should.have.property 'id'
        body.should.have.property 'rev'
        body.should.have.property 'value'
        body.value.should.be.an.Object
        body.value.should.have.property 'username'
        body.value.should.have.property 'email'
        body.value.should.have.property 'created'
        body.value.should.have.property 'picture'
        done()
    , done)




describe "byEmail", ->
  before ->
    user.newUser fake.good.username, fake.good.email
  after ->
    user.deleteUserByUsername fake.good.username
  it 'returns a standard user row', (done)->
    trycatch( ->
      user.byEmail(fake.good.email)
      .done (body)->
        body.rows.length.should.equal 1
        row = body.rows[0]
        row.should.have.property 'id'
        row.should.have.property 'key'
        row.should.have.property 'value'
        row.value.should.be.an.Object
        row.value.should.have.property '_id'
        row.value.should.have.property '_rev'
        row.value.should.have.property 'username'
        row.value.should.have.property 'email'
        row.value.should.have.property 'created'
        row.value.should.have.property 'picture'
        done()
    , done)




describe "cleanUserData", ->
  it 'returns a cleaned user', (done)->
    cleanedUser = _.cleanUserData(fakeGoodRow.value)
    cleanedUser.username.should.equal fakeGoodRow.value.username
    cleanedUser.email.should.equal fakeGoodRow.value.email
    cleanedUser.picture.should.equal fakeGoodRow.value.picture
    done()

  it 'throw on missing params', (done)->
    _.logBlue fakeBadRow.value
    (-> _.cleanUserData(fakeBadRow.value)).should.throwError()
    done()

# INTEGRATION TESTS
describe "username validation", ->
  it 'returns a confirmation when valid', (done)->
    trycatch( ->
      request(baseUrl)
        .post '/auth/username'
        .send fake.good
        .end (err, res) ->
          _.logYellow res.status, 'res.status'
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
          _.logYellow res.status, 'res.status'
          res.status.should.equal 400
          res.body.should.be.an.Object
          res.body.should.have.property('username')
          res.body.should.have.property('status')
          res.body.status.should.equal 'invalid'
          done()
    , done)

  before ->
    _.logYellow 'before'
    user.newUser fake.taken.username, fake.taken.email
  after ->
    _.logYellow 'after'
    user.deleteUserByUsername fake.taken.username

  it "returns a 'not available' status when not available username", (done)->
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

describe "everything's clean", ->
  it 'returns 0 row for fake.good user', (done)->
    trycatch( ->
      user.byUsername(fake.good.username)
      .done (body)->
        _.logYellow body, 'clean body?'
        body.rows.should.be.an.Array
        body.rows.length.should.equal 0
        done()
    , done)



fake =
  good:
    username: "validNewUserName"
    email: "user@zombo.com"
    contacts: [ "ff7ece53173603d712a91fd3850f6a38", "ff7ece53173603d712a91fd38515b016" ]
  invalid:
    username: "Invalid*name"
  taken:
    username: "takenusername"
    email: "user@zombo.com"


fakeGoodRow =
  value:
    username: 'maxlath'
    email: 'zombo@maxlath.eu'
    created: '2014-07-04T20:37:47.121Z'
    picture: 'http://www.gravatar.com/avatar/7397017c6fd5a235b5125a64b9220352'

fakeBadRow =
  value:
    username: 'maxlath'
    email: 'zombo@maxlath.eu'
    created: '2014-07-04T20:37:47.121Z'