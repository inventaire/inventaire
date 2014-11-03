should = require "should"
expect = require("chai").expect
trycatch = require "trycatch"
request = require "supertest"
fs = require 'fs'
breq = require 'breq'

__ = require('config').root
user =  __.require 'lib', 'user'

CONFIG = require('config')
baseDbUrl = CONFIG.db.fullHost()

user = __.require 'lib', 'user'
couchPath = __.path 'couchdb', 'keep_users.json'
keepUsers = JSON.parse fs.readFileSync(couchPath).toString()
keepUsersIds = keepUsers.map (user)-> return user._id

describe "searchByUsername", ->
  keepUsersIds.forEach (id)->
    it "should have kept user", (done)->
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

describe "fetchUsers", ->
  it 'should return undefined if ids is undefined or empty', (done)->
    trycatch( ->
      expect(user.fetchUsers(undefined)).to.equal.undefined
      expect(user.fetchUsers([])).to.equal.undefined
      done()
    , done)

  it 'should return a promise, then an error for invalid requests', (done)->
    trycatch( ->
      user.fetchUsers(["1"]).should.be.an.Object
      user.fetchUsers(["1"])
      .then (res)->
        res.rows[0].should.have.property 'error'
        res.rows[0].error.should.equal 'not_found'
        done()
    , done)

  it 'should return a promise, then an error for invalid requests', (done)->
    trycatch( ->
      user.fetchUsers(keepUsersIds)
      .then (res)->
        console.log res
        res.rows.length.should.equal 2
        res.rows.forEach (row)->
          row.should.have.property 'id'
          row.should.have.property 'key'
          row.value.should.be.an.Object
          row.doc.should.be.an.Object
        done()
    , done)