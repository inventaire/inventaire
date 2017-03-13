CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ authReq } = require '../utils/utils'

describe 'entities:create', ->
  it 'should create an entity', (done)->
    authReq 'post', '/api/entities?action=create',
      labels: { fr: 'bla' }
      claims: { 'wdt:P31': [ 'wd:Q571' ] }
    .then (res)->
      console.log('res', res)
      res._id.should.be.a.String()
      res._rev.should.be.a.String()
      done()
    .catch _.Error('entities create')

    return
