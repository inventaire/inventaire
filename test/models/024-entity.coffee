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

  describe 'updateClaim', ->
    it 'should return with the claim value updated', (done)->
      entityDoc = validDoc()
      entityDoc.claims.P50[0].should.equal 'Q535'
      updatedDoc = Entity.updateClaim entityDoc, 'P50', 'Q535', 'Q42'
      updatedDoc.claims.P50[0].should.equal 'Q42'
      done()

    # Requires an update: should not throw
    # it 'should throw if not passed an old value', (done)->
    #   entityDoc = validDoc()
    #   updater = -> Entity.updateClaim entityDoc, 'P50', null, 'Q42'
    #   updater.should.throw()
    #   done()

    it 'should return with the claim value removed if passed an undefined new value', (done)->
      entityDoc = validDoc()
      updatedDoc = Entity.updateClaim entityDoc, 'P50', 'Q535', null
      updatedDoc.claims.P50.length.should.equal 1
      updatedDoc2 = Entity.updateClaim updatedDoc, 'P50', 'Q1541', null
      updatedDoc2.claims.P50.length.should.equal 0
      done()
