expect = require("chai").expect
should = require "should"
trycatch = require "trycatch"
request = require "supertest"

baseUrl = require('config').fullHost
itemsRoot = '/username/items'

describe "FETCH", ->
  it "responds an array of models", (done)->
    trycatch( ->
      request(baseUrl)
        .get itemsRoot
        .end (err, res) ->
          res.status.should.equal 200
          res.body.should.be.an.Array
          res.body.forEach (model)->
            model.should.be.an.Object
            model.should.have.property('title')
            model.should.have.property('owner')
          done()
    , done)

describe "PUT", ->
  it "responds with a 201 when body is ok", (done)->
    trycatch( ->
      request(baseUrl)
      .put itemsRoot + '/' + fakeItems.goodDynamicId._id
      .send fakeItems.goodDynamicId
      .end (err, res)->
        res.status.should.equal 201
        done()
    , done)

  # it "responds with a 400 when body is empty", (done)->
  #   trycatch( ->
  #     request(baseUrl)
  #       .put(itemsRoot)
  #       .end (err, res)->
  #         res.status.should.equal 400
  #         done()
  #   , done)

describe "GET id", ->
  it "responds with a model object", (done)->
    trycatch( ->
      request(baseUrl)
      .get itemsRoot + '/' + fakeItems.good._id
      .end (err, res)->
        res.status.should.equal 200
        res.body.should.be.an.Object
        done()
    , done)







__ = require('./test-utils').path
helpers = require __.helpers + 'items'
idGen = require __.clientLib + 'id_generator'

isValidItem = helpers.isValidItem
fakeItems =
  good:
    title: "with a title"
    _id: '123126'

  goodDynamicId:
    title: "with a title"
    _id: idGen(6)

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