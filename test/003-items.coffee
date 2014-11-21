should = require "should"
trycatch = require "trycatch"
request = require "supertest"

baseUrl = require('config').fullHost()
itemsRoot = '/api/items'


__ = require('config').root
_ = __.require 'builders', 'utils'


# INTEGRATION TESTS WITH DB

_.info '', 'waiting for security implementation before re-testing db integration'
describe "FETCH", ->
  it "blocks FETCH without session", (done)->
    trycatch( ->
      request(baseUrl)
      .get(itemsRoot)
      .end (err, res) ->
        res.status.should.equal 401
        done()
    , done)


          # res.body.should.be.an.Array
          # res.body.forEach (model)->
          #   model.should.be.an.Object
          #   model.should.have.property('title')
          #   model.should.have.property('owner')

describe "PUT", ->
  it "blocks PUTs without session", (done)->
    trycatch( ->
      request(baseUrl)
      .put itemsRoot + '/' + fakeItems.goodDynamicId._id
      .send fakeItems.goodDynamicId
      .end (err, res)->
        res.status.should.equal 401
        done()
    , done)


# describe "GET id", ->
#   it "responds with a model object", (done)->
#     trycatch( ->
#       request(baseUrl)
#       .get itemsRoot + '/' + fakeItems.goodDynamicId._id
#       .end (err, res)->
#         res.status.should.equal 200
#         res.body.should.be.an.Object
#         done()
#     , done)

# describe "DELETE id", ->
#   it "responds with a unknown code so far TO BE IMPROVED", (done)->
#     trycatch(->
#       request baseUrl
#       .delete itemsRoot + '/' + fakeItems.goodDynamicId._id
#       .end (err, res)->
#         res.status.should.equal 200
#         done()
#     , done)





inv_ = __.require 'lib','inv'

isValidItem = inv_.isValidItem
fakeItems =
  good:
    title: "with a title"
    owner: "username"
    transactionMode: 'none'
    visibility: 'private'
    _id: '123126'

  goodDynamicId:
    title: "with a title"
    owner: "username"
    transactionMode: 'none'
    visibility: 'private'
    _id: _.idGenerator(6)

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