should = require "should"

CONFIG = require('config')
__ = require('./test-utils').path
_ = require __.helpers 'utils'

describe 'config', ->
  before ()->
    dbs = [CONFIG.db.users, CONFIG.db.inv]
    _.logGreen dbs, "checking Dbs before tests"
    require(__.helpers 'db').checkDbsExistanceOrCreate dbs

  it 'should use tests CONFIG', (done)->
    CONFIG.env.should.equal 'tests'
    CONFIG.db.users.should.equal 'users-tests'
    CONFIG.db.inv.should.equal 'inventory-tests'
    CONFIG.fullHost().should.equal 'http://localhost:3009'
    CONFIG.db.fullHost().should.equal 'http://localhost:5984'
    done()
