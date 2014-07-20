should = require "should"
trycatch = require "trycatch"
request = require "supertest"
fs = require 'fs'
qreq = require 'qreq'

CONFIG = require('config')
baseDbUrl = CONFIG.db.fullHost()

user = require __.helpers 'user'
keepUsers = JSON.parse fs.readFileSync(__.couchdb('keep_users.json')).toString()
keepUsersIds = keepUsers.map (user)-> return user._id

describe "searchByUsername", ->
  keepUsersIds.forEach (id)->
    it "should have keept user", (done)->
      trycatch( ->
        request(baseDbUrl)
        .get("/users/#{id}")
        .set('Accept', 'application/json')
        .end (err, res)->
          res.status.should.equal 200
          res.body.should.have.property '_id'
          res.body.should.have.property 'username'
          res.body.should.have.property 'email'
          done()
      , done)

  it "returns rows", (done)->
    trycatch( ->
      user.usernameStartBy('whatever')
      .done (res)->
        res.should.be.an.Object
        res.rows.should.be.an.Array
      done()
    , done)

  [1,2,3,4].forEach (limit)->
    it "returns limited results if a limit is set", (done)->
      trycatch( ->
        options =
          limit: limit
        user.usernameStartBy('b', options) #db_init should generate more relevant results than this
        .done (res)->
          res.should.be.an.Object
          res.rows.should.be.an.Array
          res.rows.length.should.equal options.limit
        done()
      , done)



fake =
  good:
    username: "validNewUserName"
    email: "user@zombo.com"
    contacts: [ "ff7ece53173603d712a91fd3850f6a38", "ff7ece53173603d712a91fd38515b016" ]