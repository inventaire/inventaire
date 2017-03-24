CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ nonAuthReq } = __.require 'apiTests', 'utils/utils'

describe 'entities:get:by-uris', ->
  it 'should accept alias URIs', (done)->
    aliasUri = 'twitter:bouletcorp'
    nonAuthReq 'get', "/api/entities?action=by-uris&uris=#{aliasUri}"
    .then (res)->
      { entities, redirects } = res
      canonicalUri = redirects[aliasUri]
      canonicalUri.should.equal 'wd:Q1524522'
      entity = entities[canonicalUri]
      entity.should.be.an.Object()
      entity.type.should.equal 'human'
      entity.uri.should.equal canonicalUri
      done()

    return
