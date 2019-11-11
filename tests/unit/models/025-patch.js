// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let validDocId
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const should = require('should')
const jiff = require('jiff')

const Patch = __.require('models', 'patch')

const userId = (validDocId = '12345678900987654321123456789012')
const rev = '1-d121066d145ea067b0c6638ebd050536'
const currentDoc = {
  _id: validDocId,
  _rev: rev,
  labels: {
    fr: 'yo'
  },
  claims: {
    P31: [ 'Q571' ],
    P50: [ 'Q535' ]
  },
  notTrackedAttr: 123
}

const updatedDoc = {
  _id: validDocId,
  _rev: rev,
  labels: {
    en: 'da'
  },
  claims: {
    P31: [ 'Q571' ],
    P50: [ 'Q535', 'Q2001' ],
    P135: [ 'Q53121' ]
  },
  notTrackedAttr: 456
}

const authorDoc = {
  _id: '42d699b333a86f2506208e7e6d0671cc',
  _rev: '4-760b982ea416be33c6938774db2cfaeb',
  type: 'entity',
  labels: { en: 'GBKaRq' },
  claims: { 'wdt:P31': [ 'wd:Q571' ] }
}

describe('patch', () => {
  describe('create', () => {
    it('should throw if passed an invalid user id', (done) => {
      const params =
      ((() => Patch.create({ userId: 'invalid user id', currentDoc, updatedDoc })))
      .should.throw()
      done()
    })

    it('should throw if passed identical objects', (done) => {
      ((() => Patch.create({ userId, currentDoc, updatedDoc: currentDoc })))
      .should.throw()
      done()
    })

    it('should throw if there are no changes', (done) => {
      const docClone = _.cloneDeep(currentDoc);
      ((() => Patch.create({ userId, currentDoc, updatedDoc: docClone })))
      .should.throw()
      done()
    })

    it('should throw if passed an updated doc without id', (done) => {
      const invalidDoc = _.extend({}, updatedDoc, { _id: 'invalid id' });
      ((() => Patch.create({ userId, currentDoc, updatedDoc: invalidDoc })))
      .should.throw()
      done()
    })

    it('should throw if passed an invalid doc object', (done) => {
      ((() => Patch.create({ userId, currentDoc: 'not an object', updatedDoc })))
      .should.throw();
      ((() => Patch.create({ userId, currentDoc, updatedDoc: 'not an object' })))
      .should.throw()
      done()
    })

    it('should return an object of type patch', (done) => {
      const patch = Patch.create({ userId, currentDoc, updatedDoc })
      patch.should.be.an.Object()
      patch.type.should.equal('patch')
      done()
    })

    it('should return with user set to the user passed', (done) => {
      const patch = Patch.create({ userId, currentDoc, updatedDoc })
      patch.user.should.equal(userId)
      done()
    })

    it('should return with a timestamp', (done) => {
      const now = _.now()
      const patch = Patch.create({ userId, currentDoc, updatedDoc })
      patch.timestamp.should.be.a.Number();
      (patch.timestamp >= now).should.be.true()
      done()
    })

    it('should return with a patch object', (done) => {
      const patch = Patch.create({ userId, currentDoc, updatedDoc })
      patch.patch.should.be.an.Array()
      patch.patch.forEach((op) => {
        op.should.be.an.Object()
        op.op.should.be.a.String()
        return op.path.should.be.a.String()
      })

      const updateFromPatch = jiff.patch(patch.patch, currentDoc)
      updateFromPatch.claims.should.deepEqual(updatedDoc.claims)
      updateFromPatch.labels.should.deepEqual(updatedDoc.labels)
      done()
    })

    it('should ignore data out of versionned attributes', (done) => {
      const patch = Patch.create({ userId, currentDoc, updatedDoc })
      const updateFromPatch = jiff.patch(patch.patch, currentDoc)
      updateFromPatch.notTrackedAttr.should.equal(currentDoc.notTrackedAttr)
      updateFromPatch.notTrackedAttr.should.not.equal(updatedDoc.notTrackedAttr)
      done()
    })

    it('should return with an _id built from the document id and the version', (done) => {
      const patch = Patch.create({ userId, currentDoc, updatedDoc })
      const docId = updatedDoc._id
      const version = updatedDoc._rev.split('-')[0]
      patch._id.split(':')[0].should.equal(docId)
      patch._id.split(':')[1].should.equal(version)
      done()
    })

    it('should accept an arbitrary context object', (done) => {
      const params = { userId, currentDoc, updatedDoc, context: { mergeFrom: 'bla' } }
      const patch = Patch.create(params)
      patch.should.be.an.Object()
      patch.type.should.equal('patch')
      done()
    })
  })

  return describe('revert', () => {
    it('should revert a patch', (done) => {
      const patch = Patch.create({ userId, currentDoc, updatedDoc })
      const revertedDoc = Patch.revert(updatedDoc, patch)
      revertedDoc.labels.should.deepEqual(currentDoc.labels)
      revertedDoc.claims.should.deepEqual(currentDoc.claims)
      done()
    })

    it('should revert an update patch', (done) => {
      const authorDocUpdatedA = _.cloneDeep(authorDoc)
      authorDocUpdatedA.claims['wdt:P50'] = [ 'wd:Q535' ]
      const authorDocUpdatedB = _.cloneDeep(authorDocUpdatedA)
      authorDocUpdatedB.claims['wdt:P50'] = [ 'wd:Q184226' ]
      const patchB = Patch.create({
        userId,
        currentDoc: authorDocUpdatedA,
        updatedDoc: authorDocUpdatedB
      })

      const revertedDoc = Patch.revert(authorDocUpdatedB, patchB)
      revertedDoc.claims['wdt:P50'].should.deepEqual([ 'wd:Q535' ])
      done()
    })

    it('should revert a patch between patches', (done) => {
      const authorDocUpdatedA = _.cloneDeep(authorDoc)
      authorDocUpdatedA.claims['wdt:P50'] = [ 'wd:Q535' ]
      const patchA = Patch.create({
        userId,
        currentDoc: authorDoc,
        updatedDoc: authorDocUpdatedA
      })

      const authorDocUpdatedB = _.cloneDeep(authorDocUpdatedA)
      authorDocUpdatedB.claims['wdt:P50'].push('wd:Q184226')

      const revertedDoc = Patch.revert(authorDocUpdatedB, patchA)
      revertedDoc.claims['wdt:P50'].should.deepEqual([ 'wd:Q184226' ])
      done()
    })

    it('should revert a patch between more patches', (done) => {
      const authorDocUpdatedA = _.cloneDeep(authorDoc)
      authorDocUpdatedA.claims['wdt:P50'] = [ 'wd:Q535' ]

      const authorDocUpdatedB = _.cloneDeep(authorDocUpdatedA)
      authorDocUpdatedB.claims['wdt:P50'].push('wd:Q184226')
      const patchB = Patch.create({
        userId,
        currentDoc: authorDocUpdatedA,
        updatedDoc: authorDocUpdatedB
      })

      const authorDocUpdatedC = _.cloneDeep(authorDocUpdatedB)
      authorDocUpdatedC.claims['wdt:P50'].push('wd:Q237087')

      const revertedDoc = Patch.revert(authorDocUpdatedC, patchB)
      revertedDoc.claims['wdt:P50'].should.deepEqual([ 'wd:Q535', 'wd:Q237087' ])
      done()
    })

    it('should revert a delete patch', (done) => {
      const authorDocUpdatedA = _.cloneDeep(authorDoc)
      authorDocUpdatedA.claims['wdt:P50'] = [ 'wd:Q535' ]

      const authorDocUpdatedB = _.cloneDeep(authorDocUpdatedA)
      delete authorDocUpdatedB.claims['wdt:P50']
      const patchB = Patch.create({
        userId,
        currentDoc: authorDocUpdatedA,
        updatedDoc: authorDocUpdatedB
      })

      const revertedDoc = Patch.revert(authorDocUpdatedB, patchB)
      revertedDoc.claims['wdt:P50'].should.deepEqual([ 'wd:Q535' ])
      done()
    })

    it('should revert a delete patch after the doc was re-edited', (done) => {
      const authorDocUpdatedA = _.cloneDeep(authorDoc)
      authorDocUpdatedA.claims['wdt:P50'] = [ 'wd:Q535' ]

      const authorDocUpdatedB = _.cloneDeep(authorDocUpdatedA)
      delete authorDocUpdatedB.claims['wdt:P50']
      const patchB = Patch.create({
        userId,
        currentDoc: authorDocUpdatedA,
        updatedDoc: authorDocUpdatedB
      })

      const authorDocUpdatedC = _.cloneDeep(authorDocUpdatedB)
      authorDocUpdatedC.claims['wdt:P50'] = [ 'wd:Q237087' ]

      const revertedDoc = Patch.revert(authorDocUpdatedC, patchB)
      revertedDoc.claims['wdt:P50'].should.deepEqual([ 'wd:Q237087', 'wd:Q535' ])
      done()
    })

    it('should revert a patch between patches on different claims', (done) => {
      const authorDocUpdatedA = _.cloneDeep(authorDoc)
      authorDocUpdatedA.claims['wdt:P50'] = [ 'wd:Q535' ]

      const authorDocUpdatedB = _.cloneDeep(authorDocUpdatedA)
      authorDocUpdatedB.claims['wdt:P58'] = [ 'wd:Q184226' ]
      delete authorDocUpdatedB.claims['wdt:P50']
      const patchB = Patch.create({
        userId,
        currentDoc: authorDocUpdatedA,
        updatedDoc: authorDocUpdatedB
      })

      const revertedDoc = Patch.revert(authorDocUpdatedB, patchB)
      revertedDoc.claims['wdt:P50'].should.deepEqual([ 'wd:Q535' ])
      should(revertedDoc.claims['wdt:P58']).not.be.ok()
      done()
    })

    it('should revert successive patches', (done) => {
      const authorDocUpdatedA = _.cloneDeep(authorDoc)
      authorDocUpdatedA.claims['wdt:P50'] = [ 'wd:Q535' ]

      const authorDocUpdatedB = _.cloneDeep(authorDocUpdatedA)
      authorDocUpdatedB.claims['wdt:P50'].push('wd:Q184226')
      const patchB = Patch.create({
        userId,
        currentDoc: authorDocUpdatedA,
        updatedDoc: authorDocUpdatedB
      })

      const authorDocUpdatedC = _.cloneDeep(authorDocUpdatedB)
      authorDocUpdatedC.claims['wdt:P50'].push('wd:Q42')
      const patchC = Patch.create({
        userId,
        currentDoc: authorDocUpdatedB,
        updatedDoc: authorDocUpdatedC
      })

      let revertedDoc = Patch.revert(authorDocUpdatedC, patchB)
      revertedDoc.claims['wdt:P50'].should.deepEqual([ 'wd:Q535', 'wd:Q42' ])

      // Tests that the revert works despite the patch keeping an outdated
      // index of the value
      revertedDoc = Patch.revert(revertedDoc, patchC)
      revertedDoc.claims['wdt:P50'].should.deepEqual([ 'wd:Q535' ])

      done()
    })
  })
})
