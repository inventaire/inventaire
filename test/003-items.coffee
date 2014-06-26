expect = require("chai").expect
should = require "should"
trycatch = require "trycatch"
request = require "supertest"

requireFrom = require 'require-from'
baseUrl = require('config').fullHost
__ = require('./test-utils').path
helpers = require(__.helpers + "items")


itemsRootRoute = '/username/items'


describe "FETCH", ->
  it "responds an array of models", (done)->
    trycatch( ->
      request(baseUrl)
        .get(itemsRootRoute)
        .expect(200)
        .end (err, res) ->
          res.body.should.be.an.Array
          res.body.forEach (model)->
            model.should.be.an.Object
            model.title.should.not.be.undefined
          done()
    , done)


describe "POST", ->
  it "responds with a 201 when body is ok", (done)->
    trycatch( ->
      request(baseUrl)
        .post(itemsRootRoute)
        .send { title: "Pour l'Example", _id:'123123' }
        .end (err, res)->
          res.status.should.equal 201
          done()
    , done)

  it "responds with a 400 when body is empty", (done)->
    trycatch( ->
      request(baseUrl)
        .post(itemsRootRoute)
        .end (err, res)->
          res.status.should.equal 400
          done()
    , done)

  it "responds with a 400 when no _id provided", (done)->
    trycatch( ->
      request(baseUrl)
        .post(itemsRootRoute)
        .send { title: "Pour l'Example" }
        .end (err, res)->
          res.status.should.equal 400
          done()
    , done)


isValidItem = helpers.isValidItem
fakeItems =
  good:
    title: "with a title"
    _id: "with an _id"
  noId:
    title: "with a title"
  noTitle:
    _id: "with an _id"

describe "isValidItem", ->
  it "returns true for items with title and _id", (done)->
    trycatch( ->
      isValidItem(fakeItems.good).should.be.true
      done()
    , done)

  it "returns false for items with missing attribute", (done)->
    trycatch( ->
      isValidItem(fakeItems.noId).should.be.false
      isValidItem(fakeItems.noTitle).should.be.false
      done()
    , done)