expect = require("chai").expect
should = require "should"
trycatch = require "trycatch"
request = require "supertest"

baseUrl = require('config').fullHost
__ = require('./test-utils').path

describe "hello world", ->
  it "responds 'Hello' on GET '/hello'", (done)->
    trycatch( ->
      request(baseUrl)
        .get('/hello')
        .expect(200)
        .expect(/Hello/i)
        .end(done)
    , done)