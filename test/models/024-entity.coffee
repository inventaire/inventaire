CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'

jiff = require 'jiff'

Entity = __.require 'models', 'entity'
entities_ = __.require 'controllers','entities/lib/entities'

validDoc = ->
  doc = Entity.create()
  doc._id = '12345678900987654321123456789012'
  doc.claims['wdt:P31'] = ['wd:Q571']
  doc.claims['wdt:P50'] = ['wd:Q535', 'wd:Q1541']
  return doc

describe 'entity model', ->
  describe 'create', ->
    it 'should return an object with type entity and a claims object', (done)->
      entityDoc = Entity.create()
      entityDoc.should.be.an.Object()
      entityDoc.type.should.equal 'entity'
      entityDoc.labels.should.be.an.Object()
      entityDoc.claims.should.be.an.Object()
      done()

  describe 'create claim', ->
    it 'should not throw if not passed an old value', (done)->
      updater = -> Entity.createClaim validDoc(), 'wdt:P50', 'wd:Q42'
      updater.should.not.throw()
      done()

    it 'should return a doc with the new value for an existing property', (done)->
      entityDoc = validDoc()
      lengthBefore = entityDoc.claims['wdt:P50'].length
      updatedDoc = Entity.createClaim entityDoc, 'wdt:P50', 'wd:Q42'
      updatedDoc.claims['wdt:P50'].length.should.equal lengthBefore + 1
      updatedDoc2 = Entity.createClaim entityDoc, 'wdt:P135', 'wd:Q53121'
      updatedDoc2.claims['wdt:P135'][0].should.equal 'wd:Q53121'
      done()

    it 'should return a doc with the new value for a new property', (done)->
      updatedDoc = Entity.createClaim validDoc(), 'wdt:P135', 'wd:Q53121'
      updatedDoc.claims['wdt:P135'][0].should.equal 'wd:Q53121'
      done()

    it 'should return a doc with the new value added last', (done)->
      updatedDoc = Entity.createClaim validDoc(), 'wdt:P50', 'wd:Q42'
      updatedDoc.claims['wdt:P50'].slice(-1)[0].should.equal 'wd:Q42'
      done()

    it "should throw if the new value already exist", (done)->
      entityDoc = validDoc()
      updater = -> Entity.createClaim entityDoc, 'wdt:P50', 'wd:Q1541'
      updater.should.throw()
      done()

  describe 'update claim', ->
    describe 'create claim', ->
      it 'should not throw if not passed an old value', (done)->
        updater = -> Entity.updateClaim validDoc(), 'wdt:P50', null, 'wd:Q42'
        updater.should.not.throw()
        done()

      it 'should return a doc with the new value for an existing property', (done)->
        entityDoc = validDoc()
        lengthBefore = entityDoc.claims['wdt:P50'].length
        updatedDoc = Entity.updateClaim entityDoc, 'wdt:P50', null, 'wd:Q42'
        updatedDoc.claims['wdt:P50'].length.should.equal lengthBefore + 1
        updatedDoc2 = Entity.updateClaim entityDoc, 'wdt:P135', null, 'wd:Q53121'
        updatedDoc2.claims['wdt:P135'][0].should.equal 'wd:Q53121'
        done()

      it 'should return a doc with the new value for a new property', (done)->
        updatedDoc = Entity.updateClaim validDoc(), 'wdt:P135', null, 'wd:Q53121'
        updatedDoc.claims['wdt:P135'][0].should.equal 'wd:Q53121'
        done()

      it 'should return a doc with the new value added last', (done)->
        updatedDoc = Entity.updateClaim validDoc(), 'wdt:P50', null, 'wd:Q42'
        updatedDoc.claims['wdt:P50'].slice(-1)[0].should.equal 'wd:Q42'
        done()

      it "should throw if the new value already exist", (done)->
        entityDoc = validDoc()
        updater = -> Entity.updateClaim entityDoc, 'wdt:P50', null, 'wd:Q1541'
        updater.should.throw()
        done()

    describe 'update existing claim', ->
      it 'should return with the claim value updated', (done)->
        entityDoc = validDoc()
        entityDoc.claims['wdt:P50'][0].should.equal 'wd:Q535'
        updatedDoc = Entity.updateClaim entityDoc, 'wdt:P50', 'wd:Q535', 'wd:Q42'
        updatedDoc.claims['wdt:P50'][0].should.equal 'wd:Q42'
        done()

      it "should throw if the old value doesn't exist", (done)->
        entityDoc = validDoc()
        updater = -> Entity.updateClaim entityDoc, 'wdt:P50', 'wd:Q1', 'wd:Q42'
        updater.should.throw()
        done()

      it "should throw if the new value already exist", (done)->
        entityDoc = validDoc()
        updater = -> Entity.updateClaim entityDoc, 'wdt:P50', 'wd:Q535', 'wd:Q1541'
        updater.should.throw()
        done()

    describe 'delete claim', ->
      it 'should return with the claim value removed if passed an undefined new value', (done)->
        entityDoc = validDoc()
        updatedDoc = Entity.updateClaim entityDoc, 'wdt:P50', 'wd:Q535', null
        updatedDoc.claims['wdt:P50'].length.should.equal 1
        updatedDoc2 = Entity.updateClaim updatedDoc, 'wdt:P50', 'wd:Q1541', null
        updatedDoc2.claims['wdt:P50'].length.should.equal 0
        done()

      it "should throw if the old value doesn't exist", (done)->
        entityDoc = validDoc()
        updater = -> Entity.updateClaim entityDoc, 'wdt:P50', 'wd:Q1', null
        updater.should.throw()
        done()
