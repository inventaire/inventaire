CONFIG = require('config')
expect = require("chai").expect
should = require "should"
trycatch = require "trycatch"
request = require "supertest"
baseUrl = require('config').dbFullHost
__ = require('./test-utils').path

db = require __.server + 'db'

# describe "CouchDB", ->
#   describe "database", ->
#     it "should be on config Port", (done)->
#       trycatch( ->
#         expect(db).to.be.an 'object'
#         expect(db._server.port).to.equal require('config').dbPort
#         done()
#       , done)