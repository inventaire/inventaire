CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'

Entity = __.require 'models', 'entity'

workDoc = ->
  doc = Entity.create()
  doc._id = '12345678900987654321123456789012'
  doc.claims['wdt:P31'] = ['wd:Q571']
  doc.claims['wdt:P50'] = ['wd:Q535', 'wd:Q1541']
  doc.created = Date.now()
  doc.updated = Date.now()
  return doc

editionDoc = ->
  doc = Entity.create()
  doc._id = '22345678900987654321123456789012'
  doc.claims['wdt:P31'] = ['wd:Q3331189']
  doc.claims['wdt:P629'] = ['wd:Q53592']
  doc.created = Date.now()
  doc.updated = Date.now()
  return doc

# coffeelint: disable=no_unnecessary_double_quotes
nonTrimedString = """

                  foo
            bar

        """


describe 'entity model', ->
  describe 'create', ->
    it 'should return an object with type entity and a claims object', (done)->
      now = Date.now()
      entityDoc = Entity.create()
      entityDoc.should.be.an.Object()
      entityDoc.type.should.equal 'entity'
      entityDoc.labels.should.be.an.Object()
      entityDoc.claims.should.be.an.Object()
      entityDoc.created.should.be.a.Number()
      entityDoc.created.should.be.aboveOrEqual now
      entityDoc.created.should.be.below now + 10
      should(entityDoc.updated).not.be.ok()
      done()

  describe 'create claim', ->
    it 'should add a claim value', (done)->
      doc = Entity.createClaim workDoc(), 'wdt:P50', 'wd:Q42'
      _.last(doc.claims['wdt:P50']).should.equal 'wd:Q42'
      done()

    it 'should update the timestamp', (done)->
      now = Date.now()
      entityDoc = Entity.createClaim workDoc(), 'wdt:P50', 'wd:Q42'
      entityDoc.updated.should.be.a.Number()
      entityDoc.updated.should.be.aboveOrEqual now
      entityDoc.updated.should.be.below now + 10
      done()

    it 'should return a doc with the new value for an existing property', (done)->
      entityDoc = workDoc()
      lengthBefore = entityDoc.claims['wdt:P50'].length
      updatedDoc = Entity.createClaim entityDoc, 'wdt:P50', 'wd:Q42'
      updatedDoc.claims['wdt:P50'].length.should.equal lengthBefore + 1
      updatedDoc2 = Entity.createClaim entityDoc, 'wdt:P135', 'wd:Q53121'
      updatedDoc2.claims['wdt:P135'][0].should.equal 'wd:Q53121'
      done()

    it 'should return a doc with the new value for a new property', (done)->
      updatedDoc = Entity.createClaim workDoc(), 'wdt:P135', 'wd:Q53121'
      updatedDoc.claims['wdt:P135'][0].should.equal 'wd:Q53121'
      done()

    it 'should return a doc with the new value added last', (done)->
      updatedDoc = Entity.createClaim workDoc(), 'wdt:P50', 'wd:Q42'
      updatedDoc.claims['wdt:P50'].slice(-1)[0].should.equal 'wd:Q42'
      done()

    it 'should throw if the new value already exist', (done)->
      entityDoc = workDoc()
      updater = -> Entity.createClaim entityDoc, 'wdt:P50', 'wd:Q1541'
      updater.should.throw()
      done()

  describe 'update claim', ->
    describe 'create claim', ->
      it 'should not throw if not passed an old value', (done)->
        updater = -> Entity.updateClaim workDoc(), 'wdt:P50', null, 'wd:Q42'
        updater.should.not.throw()
        done()

      it 'should update the timestamp', (done)->
        now = Date.now()
        entityDoc = workDoc()
        update = ->
          updatedDoc = Entity.updateClaim entityDoc, 'wdt:P135', null, 'wd:Q53121'
          updatedDoc.updated.should.be.a.Number()
          updatedDoc.updated.should.be.above now
          updatedDoc.updated.should.be.below now + 10
          done()
        setTimeout update, 1

      it 'should return a doc with the new value for an existing property', (done)->
        entityDoc = workDoc()
        lengthBefore = entityDoc.claims['wdt:P50'].length
        updatedDoc = Entity.updateClaim entityDoc, 'wdt:P50', null, 'wd:Q42'
        updatedDoc.claims['wdt:P50'].length.should.equal lengthBefore + 1
        updatedDoc2 = Entity.updateClaim entityDoc, 'wdt:P135', null, 'wd:Q53121'
        updatedDoc2.claims['wdt:P135'][0].should.equal 'wd:Q53121'
        done()

      it 'should return a doc with the new value for a new property', (done)->
        updatedDoc = Entity.updateClaim workDoc(), 'wdt:P135', null, 'wd:Q53121'
        updatedDoc.claims['wdt:P135'][0].should.equal 'wd:Q53121'
        done()

      it 'should return a doc with the new value added last', (done)->
        updatedDoc = Entity.updateClaim workDoc(), 'wdt:P50', null, 'wd:Q42'
        updatedDoc.claims['wdt:P50'].slice(-1)[0].should.equal 'wd:Q42'
        done()

      it 'should throw if the new value already exist', (done)->
        entityDoc = workDoc()
        updater = -> Entity.updateClaim entityDoc, 'wdt:P50', null, 'wd:Q1541'
        updater.should.throw()
        done()

      it 'should add inferred properties value', (done)->
        entityDoc = Entity.updateClaim workDoc(), 'wdt:P212', null, '978-2-7073-0152-9'
        _.warn entityDoc.claims, 'entityDoc.claims'
        entityDoc.claims['wdt:P957'][0].should.equal '2-7073-0152-3'
        entityDoc.claims['wdt:P407'][0].should.equal 'wd:Q150'
        done()

      it 'should add no inferred properties value when none is found', (done)->
        # the invalid isbn would have been rejected upfront but here allows
        # to tests cases where inferred properties convertors will fail to find a value
        entityDoc = Entity.updateClaim workDoc(), 'wdt:P212', null, '978-invalid isbn'
        should(entityDoc.claims['wdt:P957']).not.be.ok()
        should(entityDoc.claims['wdt:P407']).not.be.ok()
        done()

    it 'should trim values', (done)->
      updatedDoc = Entity.updateClaim editionDoc(), 'wd:P1476', null, nonTrimedString
      updatedDoc.claims['wd:P1476'][0].should.equal 'foo bar'
      done()

    describe 'update existing claim', ->
      it 'should return with the claim value updated', (done)->
        entityDoc = workDoc()
        entityDoc.claims['wdt:P50'][0].should.equal 'wd:Q535'
        updatedDoc = Entity.updateClaim entityDoc, 'wdt:P50', 'wd:Q535', 'wd:Q42'
        updatedDoc.claims['wdt:P50'][0].should.equal 'wd:Q42'
        done()

      it "should throw if the old value doesn't exist", (done)->
        entityDoc = workDoc()
        updater = -> Entity.updateClaim entityDoc, 'wdt:P50', 'wd:Q1', 'wd:Q42'
        updater.should.throw()
        done()

      it 'should throw if the new value already exist', (done)->
        entityDoc = workDoc()
        updater = -> Entity.updateClaim entityDoc, 'wdt:P50', 'wd:Q535', 'wd:Q1541'
        updater.should.throw()
        done()

      it 'should update the timestamp', (done)->
        now = Date.now()
        entityDoc = workDoc()
        entityDoc.claims['wdt:P50'][0].should.equal 'wd:Q535'
        update = ->
          updatedDoc = Entity.updateClaim entityDoc, 'wdt:P50', 'wd:Q535', 'wd:Q42'
          updatedDoc.claims['wdt:P50'][0].should.equal 'wd:Q42'
          updatedDoc.updated.should.be.a.Number()
          updatedDoc.updated.should.be.above now
          updatedDoc.updated.should.be.below now + 10
          done()

        setTimeout update, 1

    describe 'delete claim', ->
      it 'should return with the claim value removed if passed an undefined new value', (done)->
        updatedDoc = Entity.updateClaim workDoc(), 'wdt:P50', 'wd:Q535', null
        updatedDoc.claims['wdt:P50'].length.should.equal 1
        done()

      it 'should remove the property array if empty', (done)->
        updatedDoc = Entity.updateClaim workDoc(), 'wdt:P50', 'wd:Q535', null
        updatedDoc2 = Entity.updateClaim updatedDoc, 'wdt:P50', 'wd:Q1541', null
        should(updatedDoc2.claims['wdt:P50']).not.be.ok()
        done()

      it "should throw if the old value doesn't exist", (done)->
        entityDoc = workDoc()
        updater = -> Entity.updateClaim entityDoc, 'wdt:P50', 'wd:Q1', null
        updater.should.throw()
        done()

      it 'should remove inferred properties value', (done)->
        entityDoc = Entity.updateClaim workDoc(), 'wdt:P212', null, '978-2-7073-0152-9'
        entityDoc = Entity.updateClaim entityDoc, 'wdt:P212', '978-2-7073-0152-9', null
        should(entityDoc.claims['wdt:P957']).not.be.ok()
        should(entityDoc.claims['wdt:P407']).not.be.ok()
        done()

      it 'should throw if a critical property got zero claims', (done)->
        doc = editionDoc()
        updater = -> Entity.updateClaim doc, 'wdt:P629', 'wd:Q53592', null
        updater.should.throw('this property should at least have one value')
        done()

      it 'should update the timestamp', (done)->
        now = Date.now()
        entityDoc = workDoc()
        entityDoc.updated.should.be.a.Number()
        entityDoc.updated.should.be.aboveOrEqual now
        entityDoc.updated.should.be.below now + 10
        update = ->
          updatedDoc = Entity.updateClaim entityDoc, 'wdt:P50', 'wd:Q535', null
          updatedDoc.updated.should.be.a.Number()
          updatedDoc.updated.should.be.above now
          updatedDoc.updated.should.be.below now + 10
          done()

        setTimeout update, 1

    describe 'set label', ->
      it 'should set the label in the given lang', (done)->
        entityDoc = workDoc()
        Entity.setLabel entityDoc, 'fr', 'hello'
        entityDoc.labels.fr.should.equal 'hello'
        done()

      it 'should throw if no lang is passed', (done)->
        entityDoc = workDoc()
        updater = -> Entity.setLabel entityDoc, null, 'hello'
        updater.should.throw()
        done()

      it 'should throw if an invalid lang is passed', (done)->
        entityDoc = workDoc()
        updater = -> Entity.setLabel entityDoc, 'zz', 'hello'
        updater.should.throw()
        done()

      it 'should throw if the current and the updated label are equal', (done)->
        entityDoc = workDoc()
        updater = ->
          Entity.setLabel entityDoc, 'en', 'foo'
          Entity.setLabel entityDoc, 'en', 'foo'
        updater.should.throw()
        try updater()
        catch err then err.message.should.equal 'already up-to-date'
        done()

      it 'should trim labels', (done)->
        entityDoc = workDoc()
        Entity.setLabel entityDoc, 'fr', nonTrimedString
        entityDoc.labels.fr.should.equal 'foo bar'
        done()

      it 'should update the timestamp', (done)->
        entityDoc = workDoc()
        initialTimestamp = entityDoc.updated
        entityDoc.updated.should.be.a.Number()
        update = ->
          updatedDoc = Entity.setLabel entityDoc, 'fr', 'hello'
          updatedDoc.updated.should.be.a.Number()
          updatedDoc.updated.should.be.above initialTimestamp
          updatedDoc.updated.should.be.below initialTimestamp + 10
          done()
        setTimeout update, 1

    describe 'merge', ->
      it 'should transfer labels', (done)->
        entityA = workDoc()
        entityB = workDoc()
        Entity.setLabel entityA, 'da', 'foo'
        Entity.mergeDocs entityA, entityB
        entityB.labels.da.should.equal 'foo'
        done()

      it 'should not override existing labels', (done)->
        entityA = workDoc()
        entityB = workDoc()
        Entity.setLabel entityA, 'da', 'foo'
        Entity.setLabel entityB, 'da', 'bar'
        Entity.mergeDocs entityA, entityB
        entityB.labels.da.should.equal 'bar'
        done()

      it 'should transfer claims', (done)->
        entityA = workDoc()
        entityB = workDoc()
        Entity.createClaim entityA, 'wdt:P921', 'wd:Q3'
        Entity.mergeDocs entityA, entityB
        entityB.claims['wdt:P921'].should.deepEqual [ 'wd:Q3' ]
        done()

      it 'should not override existing claims', (done)->
        entityA = workDoc()
        entityB = workDoc()
        Entity.createClaim entityA, 'wdt:P921', 'wd:Q3'
        Entity.createClaim entityB, 'wdt:P921', 'wd:Q1'
        Entity.mergeDocs entityA, entityB
        entityB.claims['wdt:P921'].should.deepEqual [ 'wd:Q1' ]
        done()

      it 'should update the timestamp', (done)->
        entityA = workDoc()
        entityB = workDoc()
        Entity.createClaim entityA, 'wdt:P921', 'wd:Q3'
        now = Date.now()
        update = ->
          Entity.mergeDocs entityA, entityB
          entityB.updated.should.be.a.Number()
          entityB.updated.should.be.above now
          entityB.updated.should.be.below now + 10
          done()
        setTimeout update, 1
