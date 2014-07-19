should = require "should"


global.CONFIG = require('config')
global.__ = require('./test-utils').path
global._ = require __.helpers 'utils'


# _.logGreen CONFIG.env, 'CONFIG env'

describe 'config', ->

  it 'should use tests CONFIG', (done)->
    CONFIG.should.have.property 'env'
    CONFIG.env.should.equal 'tests'
    CONFIG.db.users.should.equal 'users-tests'
    CONFIG.db.inv.should.equal 'inventory-tests'
    CONFIG.fullHost().should.equal 'http://localhost:3009'
    CONFIG.db.fullHost().should.equal 'http://localhost:5984'
    done()
