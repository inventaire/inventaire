expect = require("chai").expect
should = require "should"
trycatch = require "trycatch"
request = require "supertest"
baseUrl = require('config').fullHost

# describe "user", ->
#   it "returns an array", (done)->
#     trycatch( ->
#       supertest(baseUrl)
#         .get('/username/items')
#         .expect(200)
#         .end (err, res) ->
#           res.body.should.be.an.Array
#           done()
#     , done)