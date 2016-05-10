CONFIG = require('config')
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

describe 'entities model', ->
  describe 'create', ->
    it 'should return an object with type entity and a claims object', (done)->
      entityDoc = Entity.create()
      entityDoc.should.be.an.Object()
      entityDoc.type.should.equal 'entity'
      entityDoc.labels.should.be.an.Object()
      entityDoc.claims.should.be.an.Object()
      done()

  describe 'createClaim', ->
    it 'should return an object with the new claim', (done)->
      entityDoc = Entity.create()
      property = 'P50'
      value = 'Q535'
      updatedDoc = Entity.createClaim entityDoc, property, value
      updatedDoc.should.be.an.Object()
      updatedDoc.type.should.equal 'entity'
      updatedDoc.claims.P50.should.be.an.Array()
      updatedDoc.claims.P50[0].should.equal value
      done()

  describe 'updateClaim', ->
    it 'should return with the claim value updated', (done)->
      entityDoc = validDoc()
      entityDoc.claims.P50[0].should.equal 'Q535'
      updatedDoc = Entity.updateClaim entityDoc, 'P50', 'Q535', 'Q42'
      updatedDoc.claims.P50[0].should.equal 'Q42'
      done()

    it 'should throw if not passed an old value', (done)->
      entityDoc = validDoc()
      updater = -> Entity.updateClaim entityDoc, 'P50', null, 'Q42'
      should(updater).throw()
      done()

    it 'should return with the claim value removed if passed an undefined new value', (done)->
      entityDoc = validDoc()
      updatedDoc = Entity.updateClaim entityDoc, 'P50', 'Q535', null
      updatedDoc.claims.P50.length.should.equal 1
      updatedDoc2 = Entity.updateClaim updatedDoc, 'P50', 'Q1541', null
      updatedDoc2.claims.P50.length.should.equal 0
      done()

# describe 'entities lib', ->
#   describe 'createClaim', ->
#     it 'should return a promise', (done)->
#       doc = validDoc()
#       property = 'P50'
#       value = 'Q535'
#       entities_.createClaim doc, property, value
#       .then -> done()

#     it 'should take an entity document a property and a value and resolve to an updated document', (done)->
#       doc = validDoc()
#       property = 'P50'
#       value = 'Q535'
#       entities_.createClaim doc, property, value
#       .then (updatedDoc)->
#         updatedDoc.should.be.an.Object()
#         updatedDoc.type.should.equal 'entity'
#         updatedDoc.claims.P50.should.be.an.Array()
#         updatedDoc.claims.P50[0].should.equal value
#         done()

#     it 'should return a rejected promise if passed an invalid property', (done)->
#       doc = validDoc()
#       property = 'not a prop'
#       value = 'Q535'
#       entities_.createClaim doc, property, value
#       .catch -> done()

#     it 'should return a rejected promise if passed a non-whitelisted property', (done)->
#       doc = validDoc()
#       property = 'P501111'
#       value = 'Q535'
#       entities_.createClaim doc, property, value
#       .catch -> done()

#     it 'should return a rejected promise if passed an invalid value', (done)->
#       doc = validDoc()
#       property = 'P50'
#       value = 'QQ535'
#       entities_.createClaim doc, property, value
#       .catch -> done()

#     it 'should throw on invalid value datatype', (done)->
#       doc = validDoc()
#       property = 'P50'
#       value = 123
#       entities_.createClaim doc, property, value
#       .catch (err)->
#         err.message.should.equal 'invalid value datatype'
#         done()

#     it 'should throw on invalid property value', (done)->
#       doc = validDoc()
#       property = 'P50'
#       value = 'not a qid'
#       entities_.createClaim doc, property, value
#       .catch (err)->
#         err.message.should.equal 'invalid property value'
#         done()

#     it 'should throw on invalid property value', (done)->
#       doc = validDoc()
#       property = 'P50'
#       value = 'not a qid'
#       entities_.createClaim doc, property, value
#       .catch (err)->
#         err.message.should.equal 'invalid property value'
#         done()
