import should from 'should'
import { someReference } from '#fixtures/entities'
import { superTrim } from '#lib/utils/base'
import { beforeEntityDocSave, createBlankEntityDoc, mergeEntitiesDocs, setEntityDocLabel, convertEntityDocIntoARedirection, convertEntityDocToPlaceholder, createEntityDocClaim, updateEntityDocClaim } from '#models/entity'
import type { CouchRevId, CouchUuid } from '#server/types/couchdb'
import type { EntityRedirection, InvEntity } from '#server/types/entity'
import { shouldNotBeCalled } from '#tests/unit/utils'

const workDoc = () => {
  const doc: InvEntity = Object.assign(createBlankEntityDoc(), {
    _id: '12345678900987654321123456789012' as CouchUuid,
    _rev: '5-12345678900987654321123456789012' as CouchRevId,
    created: Date.now(),
    updated: Date.now(),
  })
  doc.claims['wdt:P31'] = [ 'wd:Q47461344' ]
  doc.claims['wdt:P50'] = [ 'wd:Q535', 'wd:Q1541' ]
  return doc
}

const editionDoc = () => {
  const doc = Object.assign(createBlankEntityDoc(), {
    _id: '22345678900987654321123456789012' as CouchUuid,
    _rev: '5-12345678900987654321123456789012' as CouchRevId,
    created: Date.now(),
    updated: Date.now(),
  })
  doc.claims['wdt:P31'] = [ 'wd:Q3331189' ]
  doc.claims['wdt:P629'] = [ 'wd:Q53592' ]
  return doc
}

const nonTrimmedString = `
      foo
bar
 `

describe('entity model', () => {
  describe('create', () => {
    it('should return an object with type entity and a claims object', () => {
      const now = Date.now()
      const entityDoc = createBlankEntityDoc()
      entityDoc.should.be.an.Object()
      entityDoc.type.should.equal('entity')
      entityDoc.labels.should.be.an.Object()
      entityDoc.claims.should.be.an.Object()
      entityDoc.created.should.be.a.Number()
      entityDoc.created.should.be.aboveOrEqual(now)
      entityDoc.created.should.be.below(now + 10)
    })
  })

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
        const updater = () => createEntityDocClaim(entityDoc, 'wdt:P50', 'wd:Q1541')
        updater.should.throw()
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
        const claimObject = { value: 'wd:Q1541', references: [ someReference ] }
        const entityDoc = workDoc()
        const updater = () => createEntityDocClaim(entityDoc, 'wdt:P50', claimObject)
        updater.should.throw()
      })
    })
  })

  describe('update claim', () => {
    describe('create claim', () => {
      describe('simple claim value', () => {
        it('should not throw if not passed an old value', () => {
          const updater = () => updateEntityDocClaim(workDoc(), 'wdt:P50', null, 'wd:Q42')
          updater.should.not.throw()
        })

        it('should return a doc with the new value for an existing property', () => {
          const entityDoc = workDoc()
          const lengthBefore = entityDoc.claims['wdt:P50'].length
          const updatedDoc = updateEntityDocClaim(entityDoc, 'wdt:P50', null, 'wd:Q42')
          updatedDoc.claims['wdt:P50'].length.should.equal(lengthBefore + 1)
          const updatedDoc2 = updateEntityDocClaim(entityDoc, 'wdt:P135', null, 'wd:Q53121')
          updatedDoc2.claims['wdt:P135'][0].should.equal('wd:Q53121')
        })

        it('should return a doc with the new value for a new property', () => {
          const updatedDoc = updateEntityDocClaim(workDoc(), 'wdt:P135', null, 'wd:Q53121')
          updatedDoc.claims['wdt:P135'][0].should.equal('wd:Q53121')
        })

        it('should return a doc with the new value added last', () => {
          const updatedDoc = updateEntityDocClaim(workDoc(), 'wdt:P50', null, 'wd:Q42')
          updatedDoc.claims['wdt:P50'].at(-1).should.equal('wd:Q42')
        })

        it('should throw if the new value already exist', () => {
          const entityDoc = workDoc()
          try {
            const res = updateEntityDocClaim(entityDoc, 'wdt:P50', null, 'wd:Q1541')
            shouldNotBeCalled(res)
          } catch (err) {
            err.message.should.equal('claim property new value already exist')
          }
        })

        it('should add inferred properties value', () => {
          const entityDoc = updateEntityDocClaim(workDoc(), 'wdt:P212', null, '978-2-7073-0152-9')
          entityDoc.claims['wdt:P957'][0].should.equal('2-7073-0152-3')
          entityDoc.claims['wdt:P407'][0].should.equal('wd:Q150')
        })

        it('should add no inferred properties value when none is found', () => {
        // the invalid isbn would have been rejected upstream but here allows
        // to tests cases where inferred properties convertors will fail to find a value
          const entityDoc = updateEntityDocClaim(workDoc(), 'wdt:P212', null, '978-invalid isbn')
          should(entityDoc.claims['wdt:P957']).not.be.ok()
          should(entityDoc.claims['wdt:P407']).not.be.ok()
        })

        it('should trim values', () => {
          const updatedDoc = updateEntityDocClaim(editionDoc(), 'wdt:P1476', null, nonTrimmedString)
          updatedDoc.claims['wdt:P1476'][0].should.equal('foo bar')
        })
      })

      describe('claim object', () => {
        it('should not throw if not passed an old value', () => {
          const claimObject = { value: 'wd:Q42', references: [ someReference ] }
          const updater = () => updateEntityDocClaim(workDoc(), 'wdt:P50', null, claimObject)
          updater.should.not.throw()
        })

        it('should return a doc with the new value for an existing property', () => {
          const entityDoc = workDoc()
          const lengthBefore = entityDoc.claims['wdt:P50'].length
          const claimObject = { value: 'wd:Q42', references: [ someReference ] }
          const updatedDoc = updateEntityDocClaim(entityDoc, 'wdt:P50', null, claimObject)
          updatedDoc.claims['wdt:P50'].length.should.equal(lengthBefore + 1)
          const claimObject2 = { value: 'wd:Q53121', references: [ someReference ] }
          const updatedDoc2 = updateEntityDocClaim(entityDoc, 'wdt:P135', null, claimObject2)
          updatedDoc2.claims['wdt:P135'][0].should.deepEqual(claimObject2)
        })

        it('should return a doc with the new value for a new property', () => {
          const claimObject = { value: 'wd:Q53121', references: [ someReference ] }
          const updatedDoc = updateEntityDocClaim(workDoc(), 'wdt:P135', null, claimObject)
          updatedDoc.claims['wdt:P135'][0].should.deepEqual(claimObject)
        })

        it('should return a doc with the new value added last', () => {
          const claimObject = { value: 'wd:Q42', references: [ someReference ] }
          const updatedDoc = updateEntityDocClaim(workDoc(), 'wdt:P50', null, claimObject)
          updatedDoc.claims['wdt:P50'].at(-1).should.deepEqual(claimObject)
        })

        it('should throw if the new value already exist', () => {
          const entityDoc = workDoc()
          const claimObject = { value: 'wd:Q1541', references: [ someReference ] }
          try {
            const res = updateEntityDocClaim(entityDoc, 'wdt:P50', null, claimObject)
            shouldNotBeCalled(res)
          } catch (err) {
            err.message.should.equal('claim property new value already exist')
          }
        })

        it('should add inferred properties value', () => {
          const claimObject = { value: '978-2-7073-0152-9', references: [ someReference ] }
          const entityDoc = updateEntityDocClaim(workDoc(), 'wdt:P212', null, claimObject)
          entityDoc.claims['wdt:P957'][0].should.equal('2-7073-0152-3')
          entityDoc.claims['wdt:P407'][0].should.equal('wd:Q150')
        })

        it('should add no inferred properties value when none is found', () => {
          // the invalid isbn would have been rejected upstream but here allows
          // to tests cases where inferred properties convertors will fail to find a value
          const claimObject = { value: '978-invalid isbn', references: [ someReference ] }
          const entityDoc = updateEntityDocClaim(workDoc(), 'wdt:P212', null, claimObject)
          should(entityDoc.claims['wdt:P957']).not.be.ok()
          should(entityDoc.claims['wdt:P407']).not.be.ok()
        })

        it('should trim values', () => {
          const updatedDoc = updateEntityDocClaim(editionDoc(), 'wdt:P1476', null, { value: nonTrimmedString, references: [ someReference ] })
          updatedDoc.claims['wdt:P1476'][0].should.deepEqual({ value: 'foo bar', references: [ someReference ] })
        })
      })
    })

    describe('update existing claim', () => {
      it('should return with the claim value updated', () => {
        const entityDoc = workDoc()
        entityDoc.claims['wdt:P50'][0].should.equal('wd:Q535')
        const updatedDoc = updateEntityDocClaim(entityDoc, 'wdt:P50', 'wd:Q535', 'wd:Q42')
        updatedDoc.claims['wdt:P50'][0].should.equal('wd:Q42')
      })

      it("should throw if the old value doesn't exist", () => {
        const entityDoc = workDoc()
        const updater = () => updateEntityDocClaim(entityDoc, 'wdt:P50', 'wd:Q1', 'wd:Q42')
        updater.should.throw()
      })

      it('should throw if the new value already exist', () => {
        const entityDoc = workDoc()
        const updater = () => updateEntityDocClaim(entityDoc, 'wdt:P50', 'wd:Q535', 'wd:Q1541')
        updater.should.throw()
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

    describe('delete claim', () => {
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
        const updater = () => updateEntityDocClaim(entityDoc, 'wdt:P50', 'wd:Q1', null)
        updater.should.throw()
      })

      it('should remove inferred properties value', () => {
        let entityDoc = updateEntityDocClaim(workDoc(), 'wdt:P212', null, '978-2-7073-0152-9')
        entityDoc = updateEntityDocClaim(entityDoc, 'wdt:P212', '978-2-7073-0152-9', null)
        should(entityDoc.claims['wdt:P957']).not.be.ok()
        should(entityDoc.claims['wdt:P407']).not.be.ok()
      })
    })

    describe('set label', () => {
      it('should set the label in the given lang', () => {
        const entityDoc = workDoc()
        setEntityDocLabel(entityDoc, 'fr', 'hello')
        entityDoc.labels.fr.should.equal('hello')
      })

      it('should throw if no lang is passed', () => {
        const entityDoc = workDoc()
        const updater = () => setEntityDocLabel(entityDoc, null, 'hello')
        updater.should.throw()
      })

      it('should throw if an invalid lang is passed', () => {
        const entityDoc = workDoc()
        // @ts-expect-error
        const updater = () => setEntityDocLabel(entityDoc, 'zz', 'hello')
        updater.should.throw()
      })

      it('should throw if the current and the updated label are equal', () => {
        const entityDoc = workDoc()
        const updater = () => {
          setEntityDocLabel(entityDoc, 'en', 'foo')
          return setEntityDocLabel(entityDoc, 'en', 'foo')
        }
        updater.should.throw()
        try {
          updater()
        } catch (err) {
          err.message.should.equal('already up-to-date')
        }
      })

      it('should trim labels', () => {
        const entityDoc = workDoc()
        setEntityDocLabel(entityDoc, 'fr', nonTrimmedString)
        entityDoc.labels.fr.should.equal('foo bar')
      })

      it('should delete the label in the given lang', () => {
        const entityDoc = workDoc()
        setEntityDocLabel(entityDoc, 'fr', 'hello')
        setEntityDocLabel(entityDoc, 'de', 'hello')
        should(entityDoc.labels.de).be.ok()
        setEntityDocLabel(entityDoc, 'de', null)
        should(entityDoc.labels.de).not.be.ok()
      })

      it('should reject deleting a non-existant label', () => {
        const entityDoc = workDoc()
        should(entityDoc.labels.de).not.be.ok()
        try {
          const doc = setEntityDocLabel(entityDoc, 'de', null)
          shouldNotBeCalled(doc)
        } catch (err) {
          err.statusCode.should.equal(400)
        }
      })

      it('should reject deleting the last label', () => {
        const entityDoc = workDoc()
        setEntityDocLabel(entityDoc, 'de', 'hello')
        Object.keys(entityDoc.labels).length.should.equal(1)
        try {
          const doc = setEntityDocLabel(entityDoc, 'de', null)
          shouldNotBeCalled(doc)
        } catch (err) {
          err.statusCode.should.equal(400)
        }
      })
    })

    describe('merge', () => {
      it('should transfer labels', () => {
        const entityA = workDoc()
        const entityB = workDoc()
        setEntityDocLabel(entityA, 'da', 'foo')
        mergeEntitiesDocs(entityA, entityB)
        entityB.labels.da.should.equal('foo')
      })

      it('should not override existing labels', () => {
        const entityA = workDoc()
        const entityB = workDoc()
        setEntityDocLabel(entityA, 'da', 'foo')
        setEntityDocLabel(entityB, 'da', 'bar')
        mergeEntitiesDocs(entityA, entityB)
        entityB.labels.da.should.equal('bar')
      })

      it('should transfer claims', () => {
        const entityA = workDoc()
        const entityB = workDoc()
        createEntityDocClaim(entityA, 'wdt:P921', 'wd:Q3')
        mergeEntitiesDocs(entityA, entityB)
        entityB.claims['wdt:P921'].should.deepEqual([ 'wd:Q3' ])
      })

      it('should add new claims on already used property', () => {
        const entityA = workDoc()
        const entityB = workDoc()
        createEntityDocClaim(entityA, 'wdt:P921', 'wd:Q3')
        createEntityDocClaim(entityB, 'wdt:P921', 'wd:Q1')
        mergeEntitiesDocs(entityA, entityB)
        entityB.claims['wdt:P921'].should.deepEqual([ 'wd:Q1', 'wd:Q3' ])
      })

      it('should not add new claims on already used property linking to potential placeholders', () => {
        const entityA = workDoc()
        const entityB = workDoc()
        entityB.claims['wdt:P50'] = [ 'wd:Q1' ]
        mergeEntitiesDocs(entityA, entityB)
        entityB.claims['wdt:P50'].should.deepEqual([ 'wd:Q1' ])
      })

      it('should not create duplicated claims', () => {
        const entityA = workDoc()
        const entityB = workDoc()
        createEntityDocClaim(entityA, 'wdt:P921', 'wd:Q3')
        createEntityDocClaim(entityB, 'wdt:P921', 'wd:Q3')
        mergeEntitiesDocs(entityA, entityB)
        entityB.claims['wdt:P921'].should.deepEqual([ 'wd:Q3' ])
      })

      it('should keep the target claim in case of claim uniqueness restrictions', () => {
        const entityA = workDoc()
        const entityB = workDoc()
        createEntityDocClaim(entityA, 'wdt:P648', 'OL123456W')
        createEntityDocClaim(entityB, 'wdt:P648', 'OL123457W')
        mergeEntitiesDocs(entityA, entityB).claims['wdt:P648'].should.deepEqual([ 'OL123457W' ])
      })

      it('should refuse to merge redirections', () => {
        const redirection: EntityRedirection = {
          _id: '22345678900987654321123456789012' as CouchUuid,
          _rev: '5-12345678900987654321123456789012' as CouchRevId,
          type: 'entity',
          created: Date.now(),
          version: 5,
          redirect: 'wd:Q1',
          removedPlaceholdersIds: [],
        }
        const entity = workDoc();
        (() => mergeEntitiesDocs(redirection, entity))
        .should.throw('entity edit failed: the entity is a redirection');
        (() => mergeEntitiesDocs(entity, redirection))
        .should.throw('entity edit failed: the entity is a redirection')
      })
    })

    describe('convertEntityDocIntoARedirection', () => {
      it('should return a redirection doc', () => {
        const fromEntityDoc = workDoc()
        const toUri = 'wd:Q3209796'
        const redirection = convertEntityDocIntoARedirection(fromEntityDoc, toUri)
        redirection.should.be.an.Object()
        redirection._id.should.equal(fromEntityDoc._id)
        redirection._rev.should.equal(fromEntityDoc._rev)
        redirection.redirect.should.equal(toUri)
        // @ts-expect-error
        should(redirection.claims).not.be.ok()
        // @ts-expect-error
        should(redirection.labels).not.be.ok()
        redirection.created.should.equal(fromEntityDoc.created)
      })

      it('should be a different object', () => {
        const fromEntityDoc = workDoc()
        const toUri = 'wd:Q3209796'
        const redirection = convertEntityDocIntoARedirection(fromEntityDoc, toUri)
        // @ts-expect-error
        should(redirection === fromEntityDoc).not.be.true()
      })
    })

    describe('convertEntityDocToPlaceholder', () => {
      it('should return a removed placeholder doc', () => {
        const entity = workDoc()
        const removedPlaceholder = convertEntityDocToPlaceholder(entity)
        removedPlaceholder.should.be.an.Object()
        removedPlaceholder.labels.should.deepEqual(entity.labels)
        removedPlaceholder.claims.should.deepEqual(entity.claims)
      })

      it('should be a different object', () => {
        const entity = workDoc()
        const removedPlaceholder = convertEntityDocToPlaceholder(entity)
        should(removedPlaceholder === entity).not.be.true()
      })
    })
  })

  describe('beforeSave', () => {
    it('should validate that no critical claim is missing', () => {
      const entityDoc = workDoc()
      delete entityDoc.claims['wdt:P31']
      beforeEntityDocSave.bind(null, entityDoc).should.throw()
    })

    it('should update the timestamp', () => {
      const entityDoc = workDoc()
      entityDoc.updated -= 1000
      const timestampBefore = entityDoc.updated
      beforeEntityDocSave(entityDoc)
      entityDoc.updated.should.be.above(timestampBefore)
    })

    it('should increment the version number', () => {
      const entityDoc = workDoc()
      const { version: versionBefore } = entityDoc
      beforeEntityDocSave(entityDoc)
      entityDoc.version.should.equal(versionBefore + 1)
    })
  })
})
