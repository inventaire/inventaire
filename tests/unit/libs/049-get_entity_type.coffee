CONFIG = require 'config'
__ = CONFIG.universalPath
require 'should'
getEntityType = __.require 'controllers', 'entities/lib/get_entity_type'

describe 'get entity type', ->
  describe 'simple cases', ->
    it 'should find a work type', (done)->
      getEntityType({ 'wdt:P31': [ 'wd:Q571' ] }).should.equal 'work'
      getEntityType({ 'wdt:P279': [ 'wd:Q571' ] }).should.equal 'work'
      done()

    it 'should find a human type', (done)->
      getEntityType({ 'wdt:P31': [ 'wd:Q5' ] }).should.equal 'human'
      getEntityType({ 'wdt:P279': [ 'wd:Q5' ] }).should.equal 'human'
      done()

    it 'should find a serie type', (done)->
      getEntityType({ 'wdt:P31': [ 'wd:Q277759' ] }).should.equal 'serie'
      getEntityType({ 'wdt:P279': [ 'wd:Q277759' ] }).should.equal 'serie'
      done()

    it 'should find an edition to be an edition if it does link to a work', (done)->
      getEntityType({
        'wdt:P31': [ 'wd:Q3331189' ]
        'wdt:P629': [ 'wd:Q1304168' ]
      }).should.equal 'edition'
      done()

  describe 'editions considered to be works', ->
    it "should consider an edition to be a work if it doesn't link to a work itself", (done)->
      getEntityType({ 'wdt:P31': [ 'wd:Q3331189' ] }).should.equal 'work'
      done()

  describe 'multiple P31 values', ->
    it "should consider a work/edition to be a work if it doesn't have 'edition of' claims", (done)->
      getEntityType({ 'wdt:P31': [ 'wd:Q571', 'wd:Q3331189' ] }).should.equal 'work'
      done()

    it "should consider a work/edition to be an edition if it has 'edition of' claims", (done)->
      getEntityType({
        'wdt:P31': [ 'wd:Q571', 'wd:Q3331189' ]
        'wdt:P629': [ 'wd:Q1304168' ]
      }).should.equal 'edition'
      done()

    it "should consider a serie/edition to be a serie if it doesn't have 'edition of' claims", (done)->
      getEntityType({ 'wdt:P31': [ 'wd:Q277759', 'wd:Q3331189' ] }).should.equal 'serie'
      done()

    it "should consider a serie/edition to be an edition if it has 'edition of' claims", (done)->
      getEntityType({
        'wdt:P31': [ 'wd:Q277759', 'wd:Q3331189' ]
        'wdt:P629': [ 'wd:Q1304168' ]
      }).should.equal 'edition'
      done()

    it 'should consider a work/serie to be a serie', (done)->
      getEntityType({ 'wdt:P31': [ 'wd:Q571', 'wd:Q277759' ] }).should.equal 'serie'
      done()
