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
  doc.claims.P31 = ['Q571']
  doc.claims.P50 = ['Q535', 'Q1541']
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
      updater = -> Entity.updateClaim validDoc(), 'P50', null, 'Q42'
      updater.should.not.throw()
      done()

    it 'should return a doc with the new value', (done)->
      entityDoc = validDoc()
      lengthBefore = entityDoc.claims.P50.length
      updatedDoc = Entity.updateClaim entityDoc, 'P50', null, 'Q42'
      updatedDoc.claims.P50.length.should.equal lengthBefore + 1
      done()

    it 'should return a doc with the new value added last', (done)->
      updatedDoc = Entity.updateClaim validDoc(), 'P50', null, 'Q42'
      updatedDoc.claims.P50.slice(-1)[0].should.equal 'Q42'
      done()

  describe 'update claim', ->
    it 'should return with the claim value updated', (done)->
      entityDoc = validDoc()
      entityDoc.claims.P50[0].should.equal 'Q535'
      updatedDoc = Entity.updateClaim entityDoc, 'P50', 'Q535', 'Q42'
      updatedDoc.claims.P50[0].should.equal 'Q42'
      done()

  describe 'delete claim', ->
    it 'should return with the claim value removed if passed an undefined new value', (done)->
      entityDoc = validDoc()
      updatedDoc = Entity.updateClaim entityDoc, 'P50', 'Q535', null
      updatedDoc.claims.P50.length.should.equal 1
      updatedDoc2 = Entity.updateClaim updatedDoc, 'P50', 'Q1541', null
      updatedDoc2.claims.P50.length.should.equal 0
      done()
