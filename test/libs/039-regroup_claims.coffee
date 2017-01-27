CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

should = require 'should'
regroupClaims = __.require 'lib', 'wikidata/regroup_claims'

claimsFactory = ->
  'wdt:P31': [ 'wd:Q14406742' ]
  'wdt:P50': [ 'wd:Q740062' ]
  'wdt:P58': [ 'wd:Q239897' ]
  'wdt:P136': [ 'wd:Q2625243', 'wd:Q2882238', 'wd:Q27477672' ]
  'wdt:P361': [ 'wd:Q162328' ]
  'invp:P1': [ 'Q27478440' ]

describe 'Regroup claims', ->
  it 'should be a function', (done)->
    regroupClaims.should.be.a.Function()
    done()

  it 'should return nothing', (done)->
    should(regroupClaims(claimsFactory())).not.be.ok()
    done()

  it 'should regroup claims by property', (done)->
    claims = claimsFactory()
    claims['wdt:P50'].length.should.equal 1
    regroupClaims(claims)
    claims['wdt:P50'].length.should.equal 2
    done()

  it 'should remove the regrouped claims former property array', (done)->
    claims = claimsFactory()
    claims['wdt:P58'].length.should.equal 1
    regroupClaims(claims)
    should(claims['wdt:P58']).not.be.ok()
    done()
