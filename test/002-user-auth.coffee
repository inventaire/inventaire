expect = require('chai').expect
should = require 'should'
trycatch = require 'trycatch'
request = require 'supertest'
baseUrl = require('config').fullHost()

__ = require('config').root
_ = __.require 'builders', 'utils'

user_ = __.require 'lib','user'

# UNIT TESTS
describe "username validation", ->
  it "doesn't let in invalid characters", (done)->
    trycatch( ->
      user_.nameIsValid('PerfectLyOKName').should.be.true
      user_.nameIsValid('1210pasteque').should.be.true
      user_.nameIsValid('Badname due to spaces').should.be.false
      user_.nameIsValid('specialChar**cters').should.be.false
      user_.nameIsValid('').should.be.false
      user_.nameIsValid('UsernameHasMoreThan20character').should.be.false
      done()
    , done)


describe "username creation", ->

  after ->
    user_.deleteUserByUsername fake.good.username

  it 'returns a mapped result and not a raw row', (done)->
    trycatch( ->
      user_.newUser(fake.good.username, fake.good.email)
      .done (body)->
        body.should.be.an.Object
        body.should.have.property '_id'
        body.should.have.property '_rev'
        body.should.have.property 'username'
        body.should.have.property 'email'
        body.should.have.property 'created'
        body.should.have.property 'picture'
        done()
    , done)




describe "byEmail", ->
  before ->
    user_.newUser fake.good.username, fake.good.email
  after ->
    user_.deleteUserByUsername fake.good.username
  it 'returns a parsed user doc', (done)->
    trycatch( ->
      user_.byEmail(fake.good.email)
      .done (docs)->
        docs.length.should.equal 1
        doc = docs[0]
        doc.should.be.an.Object
        doc.should.have.property '_id'
        doc.should.have.property '_rev'
        doc.should.have.property 'username'
        doc.should.have.property 'email'
        doc.should.have.property 'created'
        doc.should.have.property 'picture'
        done()
    , done)


describe "cleanUserData", ->
  it 'returns a cleaned user', (done)->
    cleanedUser = user_.cleanUserData(fakeGoodRow.value)
    cleanedUser.username.should.equal fakeGoodRow.value.username
    cleanedUser.email.should.equal fakeGoodRow.value.email
    cleanedUser.picture.should.equal fakeGoodRow.value.picture
    done()

  it 'throw on missing params', (done)->
    _.info fakeBadRow.value
    (-> user_.cleanUserData(fakeBadRow.value)).should.throwError()
    done()

# INTEGRATION TESTS
describe "username validation", ->
  it 'returns a confirmation when valid', (done)->
    trycatch( ->
      request(baseUrl)
        .post '/api/auth/username'
        .send fake.good
        .end (err, res) ->
          _.log res.status, 'res.status'
          res.status.should.equal 200
          res.body.should.be.an.Object
          res.body.should.have.property('username')
          res.body.status.should.equal 'available'
          done()
    , done)

  it 'returns an invalid status when invalid username', (done)->
    trycatch( ->
      request(baseUrl)
        .post '/api/auth/username'
        .send fake.invalid
        .end (err, res) ->
          _.log res.status, 'res.status'
          res.status.should.equal 400
          res.body.should.be.an.Object
          res.body.should.have.property('username')
          res.body.should.have.property('status')
          res.body.status.should.equal 'invalid'
          done()
    , done)

  before ->
    _.log 'before'
    user_.newUser fake.taken.username, fake.taken.email
  after ->
    _.log 'after'
    user_.deleteUserByUsername fake.taken.username

  it "returns a 'not available' status when not available username", (done)->
    trycatch( ->
      request(baseUrl)
        .post '/api/auth/username'
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
      user_.byUsername(fake.good.username)
      .done (docs)->
        _.log docs, 'clean docs?'
        docs.should.be.an.Array
        docs.length.should.equal 0
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