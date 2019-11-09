CONFIG = require 'config'
__ = CONFIG.universalPath
should = require 'should'
getEntityType = __.require 'controllers', 'entities/lib/get_entity_type'

describe 'get entity type', ->
  describe 'inv entity', ->
    it 'should find a work type', (done)->
      getEntityType.inv({ 'wdt:P31': [ 'wd:Q571' ] }).should.equal 'work'
      done()

    it 'should find a human type', (done)->
      getEntityType.inv({ 'wdt:P31': [ 'wd:Q5' ] }).should.equal 'human'
      done()

    it 'should find a serie type', (done)->
      getEntityType.inv({ 'wdt:P31': [ 'wd:Q277759' ] }).should.equal 'serie'
      done()

    it 'should find a edition type', (done)->
      getEntityType.inv({ 'wdt:P31': [ 'wd:Q3331189' ] }).should.equal 'edition'
      done()

    it 'should find a publisher type', (done)->
      getEntityType.inv({ 'wdt:P31': [ 'wd:Q2085381' ] }).should.equal 'publisher'
      done()

  describe 'wd entity', ->
    describe 'simple cases', ->
      it 'should find a work type', (done)->
        getEntityType.wd({ 'wdt:P31': [ 'wd:Q571' ] }).should.equal 'work'
        getEntityType.wd({ 'wdt:P279': [ 'wd:Q571' ] }).should.equal 'work'
        done()

      it 'should find a human type', (done)->
        getEntityType.wd({ 'wdt:P31': [ 'wd:Q5' ] }).should.equal 'human'
        getEntityType.wd({ 'wdt:P279': [ 'wd:Q5' ] }).should.equal 'human'
        done()

      it 'should find a serie type', (done)->
        getEntityType.wd({ 'wdt:P31': [ 'wd:Q277759' ] }).should.equal 'serie'
        getEntityType.wd({ 'wdt:P279': [ 'wd:Q277759' ] }).should.equal 'serie'
        done()

    describe 'editions considered to be works', ->
      it "should consider an edition to be a work if it doesn't link to a work itself", (done)->
        getEntityType.wd({ 'wdt:P31': [ 'wd:Q3331189' ] }).should.equal 'work'
        done()

    describe 'multiple P31 values', ->
      it "should consider a work/edition to be a work if it doesn't have 'edition of' claims", (done)->
        getEntityType.wd({ 'wdt:P31': [ 'wd:Q571', 'wd:Q3331189' ] }).should.equal 'work'
        done()


      it "should consider a serie/edition to be a serie if it doesn't have 'edition of' claims", (done)->
        getEntityType.wd({ 'wdt:P31': [ 'wd:Q277759', 'wd:Q3331189' ] }).should.equal 'serie'
        done()


      it 'should consider a work/serie to be a serie', (done)->
        getEntityType.wd({ 'wdt:P31': [ 'wd:Q571', 'wd:Q277759' ] }).should.equal 'serie'
        done()

    describe 'editions quarantine: entities of type edition return an undefined type', ->
      it "should consider a work/edition to be an edition if it has 'edition of' claims", (done)->
        should(getEntityType.wd({
          'wdt:P31': [ 'wd:Q571', 'wd:Q3331189' ]
          'wdt:P629': [ 'wd:Q1304168' ]
        })).not.be.ok()
        done()

    it 'should find an edition to be an edition if it does link to a work', (done)->
      should(getEntityType.wd({
        'wdt:P31': [ 'wd:Q3331189' ]
        'wdt:P629': [ 'wd:Q1304168' ]
      })).not.be.ok()
      done()

      it "should consider a serie/edition to be an edition if it has 'edition of' claims", (done)->
        should(getEntityType.wd({
          'wdt:P31': [ 'wd:Q277759', 'wd:Q3331189' ]
          'wdt:P629': [ 'wd:Q1304168' ]
        })).not.be.ok()
        done()
