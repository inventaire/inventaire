# fixes the problem with wrong line numbers in stack reports
require 'coffee-errors'

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require('builders', 'utils')

should = require 'should'

describe 'config', ->

  it 'should use tests CONFIG', (done)->
    CONFIG.should.have.property 'env'
    CONFIG.env.should.equal 'tests'
    CONFIG.db.name('users').should.equal 'users-tests'
    CONFIG.db.name('inventory').should.equal 'inventory-tests'
    CONFIG.db.name('entities').should.equal 'entities-tests'
    # CONFIG.fullHost().should.equal 'http://localhost:3009'
    # CONFIG.db.fullHost().should.equal 'http://localhost:5984'
    done()
