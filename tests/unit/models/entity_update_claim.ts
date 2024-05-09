// TODO: Updating claim object value to direct claim value should get rid of the reference
import should from 'should'
import { someReference, someReferenceB } from '#fixtures/entities'
import { superTrim } from '#lib/utils/base'
import { createBlankEntityDoc, createEntityDocClaim, updateEntityDocClaim } from '#models/entity'
import type { CouchRevId, CouchUuid } from '#server/types/couchdb'
import type { EntityUri, InvEntity, InvPropertyClaims, WdEntityUri } from '#server/types/entity'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'

const workDoc = () => {
  const doc: InvEntity = {
    ...createBlankEntityDoc(),
    _id: '12345678900987654321123456789012' as CouchUuid,
    _rev: '5-12345678900987654321123456789012' as CouchRevId,
    created: Date.now(),
    updated: Date.now(),
  }
  doc.claims['wdt:P31'] = [ 'wd:Q47461344' as WdEntityUri ]
  doc.claims['wdt:P50'] = [ 'wd:Q535' as WdEntityUri, 'wd:Q1541' as WdEntityUri ]
  doc.claims['wdt:P144'] = [ { value: 'wd:Q150827', references: [ someReference ] }, 'wd:Q29478' ]
  return doc
}

const editionDoc = () => {
  const doc = {
    ...createBlankEntityDoc(),
    _id: '22345678900987654321123456789012' as CouchUuid,
    _rev: '5-12345678900987654321123456789012' as CouchRevId,
    created: Date.now(),
    updated: Date.now(),
  }
  doc.claims['wdt:P31'] = [ 'wd:Q3331189' as WdEntityUri ]
  doc.claims['wdt:P629'] = [ 'wd:Q53592' as WdEntityUri ]
  return doc
}

const nonTrimmedString = `
      foo
bar
 `

describe('entity model: update claim', () => {
  describe('create claim', () => {
    describe('simple claim value', () => {
      it('should add a claim value', () => {
        const doc = createEntityDocClaim(workDoc(), 'wdt:P50', 'wd:Q42')
        doc.claims['wdt:P50'].at(-1).should.equal('wd:Q42')
      })

      it('should return a doc with the new value for an existing property', () => {
        const entityDoc = workDoc()
        const lengthBefore = entityDoc.claims['wdt:P50'].length
        const updatedDoc = createEntityDocClaim(entityDoc, 'wdt:P50', 'wd:Q42')
        updatedDoc.claims['wdt:P50'].length.should.equal(lengthBefore + 1)
        const updatedDoc2 = createEntityDocClaim(entityDoc, 'wdt:P135', 'wd:Q53121')
        updatedDoc2.claims['wdt:P135'][0].should.equal('wd:Q53121')
      })

      it('should return a doc with the new value for a new property', () => {
        const updatedDoc = createEntityDocClaim(workDoc(), 'wdt:P135', 'wd:Q53121')
        updatedDoc.claims['wdt:P135'][0].should.equal('wd:Q53121')
      })

      it('should return a doc with the new value added last', () => {
        const updatedDoc = createEntityDocClaim(workDoc(), 'wdt:P50', 'wd:Q42')
        updatedDoc.claims['wdt:P50'].at(-1).should.equal('wd:Q42')
      })

      it('should throw if the new value already exist', () => {
        const entityDoc = workDoc()
        try {
          const res = createEntityDocClaim(entityDoc, 'wdt:P50', 'wd:Q1541')
          shouldNotBeCalled(res)
        } catch (err) {
          err.message.should.equal('claim property new value already exist')
        }
      })

      it('should not throw if not passed an old value', () => {
        const updater = () => createEntityDocClaim(workDoc(), 'wdt:P50', 'wd:Q42')
        updater.should.not.throw()
      })

      it('should add inferred properties value', () => {
        const entityDoc = createEntityDocClaim(workDoc(), 'wdt:P212', '978-2-7073-0152-9')
        entityDoc.claims['wdt:P957'][0].should.equal('2-7073-0152-3')
        entityDoc.claims['wdt:P407'][0].should.equal('wd:Q150')
      })

      it('should add no inferred properties value when none is found', () => {
        // the invalid isbn would have been rejected upstream but here allows
        // to tests cases where inferred properties convertors will fail to find a value
        const entityDoc = createEntityDocClaim(workDoc(), 'wdt:P212', '978-invalid isbn')
        should(entityDoc.claims['wdt:P957']).not.be.ok()
        should(entityDoc.claims['wdt:P407']).not.be.ok()
      })

      it('should trim values', () => {
        const updatedDoc = createEntityDocClaim(editionDoc(), 'wdt:P1476', nonTrimmedString)
        updatedDoc.claims['wdt:P1476'][0].should.equal('foo bar')
      })
    })

    describe('claim object', () => {
      it('should add a claim value', () => {
        const claimObject = { value: 'wd:Q42', references: [ someReference ] }
        const doc = createEntityDocClaim(workDoc(), 'wdt:P50', claimObject)
        doc.claims['wdt:P50'].at(-1).should.deepEqual(claimObject)
      })

      it('should return a doc with the new value for an existing property', () => {
        const entityDoc = workDoc()
        const lengthBefore = entityDoc.claims['wdt:P50'].length
        const updatedDoc = createEntityDocClaim(entityDoc, 'wdt:P50', { value: 'wd:Q42', references: [ someReference ] })
        updatedDoc.claims['wdt:P50'].length.should.equal(lengthBefore + 1)
        const claimObject = { value: 'wd:Q53121', references: [ someReference ] }
        const updatedDoc2 = createEntityDocClaim(entityDoc, 'wdt:P135', claimObject)
        updatedDoc2.claims['wdt:P135'][0].should.deepEqual(claimObject)
      })

      it('should return a doc with the new value for a new property', () => {
        const claimObject = { value: 'wd:Q53121', references: [ someReference ] }
        const updatedDoc = createEntityDocClaim(workDoc(), 'wdt:P135', claimObject)
        updatedDoc.claims['wdt:P135'][0].should.deepEqual(claimObject)
      })

      it('should return a doc with the new value added last', () => {
        const claimObject = { value: 'wd:Q42', references: [ someReference ] }
        const updatedDoc = createEntityDocClaim(workDoc(), 'wdt:P50', claimObject)
        updatedDoc.claims['wdt:P50'].at(-1).should.deepEqual(claimObject)
      })

      it('should throw if the new value already exist', () => {
        const entityDoc = workDoc()
        const claimObject = { value: 'wd:Q1541', references: [ someReference ] }
        try {
          const res = createEntityDocClaim(entityDoc, 'wdt:P50', claimObject)
          shouldNotBeCalled(res)
        } catch (err) {
          err.message.should.equal('claim property new value already exist')
        }
      })

      it('should not throw if not passed an old value', () => {
        const claimObject = { value: 'wd:Q42', references: [ someReference ] }
        const updater = () => createEntityDocClaim(workDoc(), 'wdt:P50', claimObject)
        updater.should.not.throw()
      })

      it('should add inferred properties value', () => {
        const claimObject = { value: '978-2-7073-0152-9', references: [ someReference ] }
        const entityDoc = createEntityDocClaim(workDoc(), 'wdt:P212', claimObject)
        entityDoc.claims['wdt:P957'][0].should.equal('2-7073-0152-3')
        entityDoc.claims['wdt:P407'][0].should.equal('wd:Q150')
      })

      it('should add no inferred properties value when none is found', () => {
        // the invalid isbn would have been rejected upstream but here allows
        // to tests cases where inferred properties convertors will fail to find a value
        const claimObject = { value: '978-invalid isbn', references: [ someReference ] }
        const entityDoc = createEntityDocClaim(workDoc(), 'wdt:P212', claimObject)
        should(entityDoc.claims['wdt:P957']).not.be.ok()
        should(entityDoc.claims['wdt:P407']).not.be.ok()
      })

      it('should trim values', () => {
        const updatedDoc = createEntityDocClaim(editionDoc(), 'wdt:P1476', { value: nonTrimmedString, references: [ someReference ] })
        updatedDoc.claims['wdt:P1476'][0].should.deepEqual({ value: 'foo bar', references: [ someReference ] })
      })
    })
  })

  describe('update existing claim', () => {
    describe('simple claim value', () => {
      it('should return with the claim value updated', () => {
        const entityDoc = workDoc()
        entityDoc.claims['wdt:P50'][0].should.equal('wd:Q535')
        const updatedDoc = updateEntityDocClaim(entityDoc, 'wdt:P50', 'wd:Q535', 'wd:Q42')
        updatedDoc.claims['wdt:P50'][0].should.equal('wd:Q42')
      })

      it("should throw if the old value doesn't exist", () => {
        const entityDoc = workDoc()
        try {
          const res = updateEntityDocClaim(entityDoc, 'wdt:P50', 'wd:Q1', 'wd:Q42')
          shouldNotBeCalled(res)
        } catch (err) {
          err.message.should.equal('claim property value not found')
        }
      })

      it('should throw if the new value already exist', () => {
        const entityDoc = workDoc()
        try {
          const res = updateEntityDocClaim(entityDoc, 'wdt:P50', 'wd:Q535', 'wd:Q1541')
          shouldNotBeCalled(res)
        } catch (err) {
          err.message.should.equal('claim property new value already exist')
        }
      })

      it('should allow to update a claim despite formatting issues that were previously accepted', () => {
        const entityDoc = editionDoc()
        const badlyFormattedTitle = 'too  many  spaces'
        const newTitle = 'some title'
        entityDoc.claims['wdt:P1476'] = [ badlyFormattedTitle ]
        const updatedDoc = updateEntityDocClaim(entityDoc, 'wdt:P1476', badlyFormattedTitle, newTitle)
        updatedDoc.claims['wdt:P1476'].should.deepEqual([ newTitle ])
      })

      it('should allow to fix formatting issues that were previously accepted', () => {
        const entityDoc = editionDoc()
        const badlyFormattedTitle = 'too  many  spaces'
        const fixedTitle = superTrim(badlyFormattedTitle)
        entityDoc.claims['wdt:P1476'] = [ badlyFormattedTitle ]
        const updatedDoc = updateEntityDocClaim(entityDoc, 'wdt:P1476', badlyFormattedTitle, fixedTitle)
        updatedDoc.claims['wdt:P1476'].should.deepEqual([ fixedTitle ])
      })
    })

    describe('claim object', () => {
      it('should return with the claim value updated: simple claim to claim object', () => {
        const entityDoc = workDoc()
        entityDoc.claims['wdt:P50'][0].should.equal('wd:Q535')
        const claimObject = { value: 'wd:Q42', references: [ someReference ] }
        const updatedDoc = updateEntityDocClaim(entityDoc, 'wdt:P50', 'wd:Q535', claimObject)
        updatedDoc.claims['wdt:P50'][0].should.deepEqual(claimObject)
      })

      it('should return with the claim value updated: claim object to simple claim', () => {
        const entityDoc = workDoc()
        const claimObject = { value: 'wd:Q42' as WdEntityUri, references: [ someReference ] }
        entityDoc.claims['wdt:P50'] = [ claimObject ]
        const claimValue = 'wd:Q181659'
        const updatedDoc = updateEntityDocClaim(entityDoc, 'wdt:P50', claimObject.value, claimValue)
        updatedDoc.claims['wdt:P50'][0].should.deepEqual(claimValue)
      })

      it('should return with the claim value updated: claim object to claim object', () => {
        const entityDoc = workDoc()
        const claimObject = { value: 'wd:Q42' as WdEntityUri, references: [ someReference ] }
        entityDoc.claims['wdt:P50'] = [ claimObject ]
        const claimObject2 = { value: 'wd:Q181659', references: [ someReferenceB ] }
        const updatedDoc = updateEntityDocClaim(entityDoc, 'wdt:P50', claimObject.value, claimObject2)
        updatedDoc.claims['wdt:P50'][0].should.deepEqual(claimObject2)
      })

      it("should throw if the old value doesn't exist", () => {
        const entityDoc = workDoc()
        const claimObject = { value: 'wd:Q42', references: [ someReference ] }
        try {
          const res = updateEntityDocClaim(entityDoc, 'wdt:P50', 'wd:Q1', claimObject)
          shouldNotBeCalled(res)
        } catch (err) {
          err.message.should.equal('claim property value not found')
        }
      })

      it('should throw if the new value already exist', () => {
        const entityDoc = workDoc()
        const claimObject = { value: 'wd:Q1541', references: [ someReference ] }
        try {
          const res = updateEntityDocClaim(entityDoc, 'wdt:P50', 'wd:Q535', claimObject)
          shouldNotBeCalled(res)
        } catch (err) {
          err.message.should.equal('claim property new value already exist')
        }
      })

      it('should allow to update a claim despite formatting issues that were previously accepted', () => {
        const entityDoc = editionDoc()
        const badlyFormattedTitle = 'too  many  spaces'
        entityDoc.claims['wdt:P1476'] = [ badlyFormattedTitle ]
        const claimObject = { value: 'some title', references: [ someReference ] }
        const updatedDoc = updateEntityDocClaim(entityDoc, 'wdt:P1476', badlyFormattedTitle, claimObject)
        updatedDoc.claims['wdt:P1476'].should.deepEqual([ claimObject ])
      })

      it('should allow to fix formatting issues that were previously accepted', () => {
        const entityDoc = editionDoc()
        const badlyFormattedTitle = 'too  many  spaces'
        const fixedTitle = superTrim(badlyFormattedTitle)
        const claimObject = { value: fixedTitle, references: [ someReference ] }
        entityDoc.claims['wdt:P1476'] = [ badlyFormattedTitle ]
        const updatedDoc = updateEntityDocClaim(entityDoc, 'wdt:P1476', badlyFormattedTitle, claimObject)
        updatedDoc.claims['wdt:P1476'].should.deepEqual([ claimObject ])
      })
    })
  })

  describe('delete claim', () => {
    describe('simple claim value', () => {
      it('should return with the claim value removed if passed an undefined new value', () => {
        const updatedDoc = updateEntityDocClaim(workDoc(), 'wdt:P50', 'wd:Q535', null)
        updatedDoc.claims['wdt:P50'].length.should.equal(1)
      })

      it('should remove the property array if empty', () => {
        const updatedDoc = updateEntityDocClaim(workDoc(), 'wdt:P50', 'wd:Q535', null)
        const updatedDoc2 = updateEntityDocClaim(updatedDoc, 'wdt:P50', 'wd:Q1541', null)
        should(updatedDoc2.claims['wdt:P50']).not.be.ok()
      })

      it("should throw if the old value doesn't exist", () => {
        const entityDoc = workDoc()
        try {
          const res = updateEntityDocClaim(entityDoc, 'wdt:P50', 'wd:Q1', null)
          shouldNotBeCalled(res)
        } catch (err) {
          err.message.should.equal('claim property value not found')
        }
      })

      it('should remove inferred properties value', () => {
        let entityDoc = updateEntityDocClaim(workDoc(), 'wdt:P212', null, '978-2-7073-0152-9')
        entityDoc = updateEntityDocClaim(entityDoc, 'wdt:P212', '978-2-7073-0152-9', null)
        should(entityDoc.claims['wdt:P957']).not.be.ok()
        should(entityDoc.claims['wdt:P407']).not.be.ok()
      })
    })

    describe('claim object', () => {
      it('should return with the claim value removed if passed an undefined new value', () => {
        const updatedDoc = updateEntityDocClaim(workDoc(), 'wdt:P144', 'wd:Q150827', null)
        updatedDoc.claims['wdt:P144'].length.should.equal(1)
      })

      it('should remove the property array if empty', () => {
        const updatedDoc = updateEntityDocClaim(workDoc(), 'wdt:P144', 'wd:Q29478', null)
        const updatedDoc2 = updateEntityDocClaim(updatedDoc, 'wdt:P144', 'wd:Q150827', null)
        should(updatedDoc2.claims['wdt:P144']).not.be.ok()
      })

      it("should throw if the old value doesn't exist", () => {
        const entityDoc = workDoc()
        try {
          const res = updateEntityDocClaim(entityDoc, 'wdt:P144', { value: 'wd:Q1', references: [ someReference ] }, null)
          shouldNotBeCalled(res)
        } catch (err) {
          err.message.should.equal('claim property value not found')
        }
      })

      it('should remove inferred properties value', () => {
        const claimObject = { value: '978-2-7073-0152-9', references: [ someReference ] }
        let entityDoc = updateEntityDocClaim(workDoc(), 'wdt:P212', null, claimObject)
        entityDoc = updateEntityDocClaim(entityDoc, 'wdt:P212', '978-2-7073-0152-9', null)
        should(entityDoc.claims['wdt:P957']).not.be.ok()
        should(entityDoc.claims['wdt:P407']).not.be.ok()
      })
    })
  })
})
