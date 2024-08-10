import should from 'should'
import { someReference, someReferenceB } from '#fixtures/entities'
import { beforeEntityDocSave, createBlankEntityDoc, mergeEntitiesDocs, setEntityDocLabel, convertEntityDocIntoARedirection, convertEntityDocToPlaceholder, createEntityDocClaim } from '#models/entity'
import type { CouchRevId, CouchUuid } from '#server/types/couchdb'
import type { EntityRedirection } from '#server/types/entity'
import { workDoc } from '#tests/unit/utils/entity'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'

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

  // See file://./entity_update_claim.ts
  // describe('create/update/delete claim')

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
      const claimObject = { value: 'wd:Q9896', references: [ someReference ] }
      createEntityDocClaim(entityA, 'wdt:P921', claimObject)
      mergeEntitiesDocs(entityA, entityB)
      entityB.claims['wdt:P921'].should.deepEqual([ 'wd:Q3', claimObject ])
    })

    it('should add new claims on already used property', () => {
      const entityA = workDoc()
      const entityB = workDoc()
      createEntityDocClaim(entityA, 'wdt:P921', 'wd:Q3')
      const claimObject = { value: 'wd:Q9896', references: [ someReference ] }
      createEntityDocClaim(entityA, 'wdt:P921', claimObject)
      createEntityDocClaim(entityB, 'wdt:P921', 'wd:Q1')
      mergeEntitiesDocs(entityA, entityB)
      entityB.claims['wdt:P921'].should.deepEqual([ 'wd:Q1', 'wd:Q3', claimObject ])
    })

    it('should not add new claims on already used property linking to potential placeholders', () => {
      const entityA = workDoc()
      const entityB = workDoc()
      entityA.claims['wdt:P50'] = [ 'wd:Q1' ]
      entityB.claims['wdt:P50'] = [ 'wd:Q2' ]
      mergeEntitiesDocs(entityA, entityB)
      entityB.claims['wdt:P50'].should.deepEqual([ 'wd:Q2' ])
    })

    it('should merge claim references', () => {
      const entityA = workDoc()
      const entityB = workDoc()
      createEntityDocClaim(entityA, 'wdt:P921', { value: 'wd:Q9896', references: [ someReference ] })
      createEntityDocClaim(entityB, 'wdt:P921', { value: 'wd:Q9896', references: [ someReferenceB ] })
      mergeEntitiesDocs(entityA, entityB)
      entityB.claims['wdt:P921'].should.deepEqual([ { value: 'wd:Q9896', references: [ someReferenceB, someReference ] } ])
    })

    it('should not create duplicated claims', () => {
      const entityA = workDoc()
      const entityB = workDoc()
      createEntityDocClaim(entityA, 'wdt:P921', 'wd:Q3')
      createEntityDocClaim(entityB, 'wdt:P921', 'wd:Q3')
      mergeEntitiesDocs(entityA, entityB)
      entityB.claims['wdt:P921'].should.deepEqual([ 'wd:Q3' ])
    })

    it('should not create duplicated claims, but transfer references', () => {
      const entityA = workDoc()
      const entityB = workDoc()
      createEntityDocClaim(entityA, 'wdt:P921', { value: 'wd:Q9896', references: [ someReference ] })
      createEntityDocClaim(entityB, 'wdt:P921', 'wd:Q9896')
      mergeEntitiesDocs(entityA, entityB)
      entityB.claims['wdt:P921'].should.deepEqual([ { value: 'wd:Q9896', references: [ someReference ] } ])
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

    describe('simple claim value', () => {
      it('should keep the target claim in case of claim uniqueness restrictions', () => {
        const entityA = workDoc()
        const entityB = workDoc()
        createEntityDocClaim(entityA, 'wdt:P648', 'OL123456W')
        createEntityDocClaim(entityB, 'wdt:P648', 'OL123457W')
        mergeEntitiesDocs(entityA, entityB).claims['wdt:P648'].should.deepEqual([ 'OL123457W' ])
      })
    })

    describe('claim object', () => {
      it('should keep the target claim in case of claim uniqueness restrictions (claim object to simple claim)', () => {
        const entityA = workDoc()
        const entityB = workDoc()
        createEntityDocClaim(entityA, 'wdt:P648', { value: 'OL123456W', references: [ someReference ] })
        createEntityDocClaim(entityB, 'wdt:P648', 'OL123457W')
        mergeEntitiesDocs(entityA, entityB).claims['wdt:P648'].should.deepEqual([ 'OL123457W' ])
      })

      it('should keep the target claim in case of claim uniqueness restrictions (simple claim to claim object )', () => {
        const entityA = workDoc()
        const entityB = workDoc()
        createEntityDocClaim(entityA, 'wdt:P648', 'OL123457W')
        createEntityDocClaim(entityB, 'wdt:P648', { value: 'OL123456W', references: [ someReference ] })
        mergeEntitiesDocs(entityA, entityB).claims['wdt:P648'].should.deepEqual([ { value: 'OL123456W', references: [ someReference ] } ])
      })
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
