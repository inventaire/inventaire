const _ = require('builders/utils')
const should = require('should')
const jiff = require('jiff')
const randomString = require('lib/utils/random_string')
const Entity = require('models/entity')
const Patch = require('models/patch')

const validDocId = '12345678900987654321123456789012'
const userId = validDocId
const someRev = '1-d121066d145ea067b0c6638ebd050536'
const currentDoc = {
  _id: validDocId,
  _rev: someRev,
  labels: {
    fr: 'yo'
  },
  claims: {
    P31: [ 'Q47461344' ],
    P50: [ 'Q535' ]
  },
  notTrackedAttr: 123,
  version: 4
}

const updatedDoc = {
  _id: validDocId,
  _rev: someRev,
  labels: {
    en: 'da'
  },
  claims: {
    P31: [ 'Q47461344' ],
    P50: [ 'Q535', 'Q2001' ],
    P135: [ 'Q53121' ]
  },
  notTrackedAttr: 456,
  version: 5
}

const authorDoc = {
  _id: '42d699b333a86f2506208e7e6d0671cc',
  _rev: '4-760b982ea416be33c6938774db2cfaeb',
  type: 'entity',
  labels: { en: 'GBKaRq' },
  claims: { 'wdt:P31': [ 'wd:Q47461344' ] }
}

describe('patch', () => {
  describe('create', () => {
    it('should throw if passed an invalid user id', () => {
      (() => Patch.create({ userId: 'invalid user id', currentDoc, updatedDoc }))
      .should.throw()
    })

    it('should throw if passed identical objects', () => {
      (() => Patch.create({ userId, currentDoc, updatedDoc: currentDoc }))
      .should.throw()
    })

    it('should throw if there are no changes', () => {
      const docClone = _.cloneDeep(currentDoc);
      (() => Patch.create({ userId, currentDoc, updatedDoc: docClone }))
      .should.throw()
    })

    it('should throw if passed an updated doc without id', () => {
      const invalidDoc = Object.assign({}, updatedDoc, { _id: 'invalid id' });
      (() => Patch.create({ userId, currentDoc, updatedDoc: invalidDoc }))
      .should.throw()
    })

    it('should throw if passed an invalid doc object', () => {
      (() => Patch.create({ userId, currentDoc: 'not an object', updatedDoc }))
      .should.throw();
      (() => Patch.create({ userId, currentDoc, updatedDoc: 'not an object' }))
      .should.throw()
    })

    it('should return an object of type patch', () => {
      const patch = Patch.create({ userId, currentDoc, updatedDoc })
      patch.should.be.an.Object()
      patch.type.should.equal('patch')
    })

    it('should return with user set to the user passed', () => {
      const patch = Patch.create({ userId, currentDoc, updatedDoc })
      patch.user.should.equal(userId)
    })

    it('should return with a timestamp', () => {
      const now = _.now()
      const patch = Patch.create({ userId, currentDoc, updatedDoc })
      patch.timestamp.should.be.a.Number()
      should(patch.timestamp >= now).be.true()
    })

    it('should return with a patch object', () => {
      const patch = Patch.create({ userId, currentDoc, updatedDoc })
      patch.patch.should.be.an.Array()
      patch.patch.forEach(op => {
        op.should.be.an.Object()
        op.op.should.be.a.String()
        return op.path.should.be.a.String()
      })

      const updateFromPatch = jiff.patch(patch.patch, currentDoc)
      updateFromPatch.claims.should.deepEqual(updatedDoc.claims)
      updateFromPatch.labels.should.deepEqual(updatedDoc.labels)
    })

    it('should ignore data out of versionned attributes', () => {
      const patch = Patch.create({ userId, currentDoc, updatedDoc })
      const updateFromPatch = jiff.patch(patch.patch, currentDoc)
      updateFromPatch.notTrackedAttr.should.equal(currentDoc.notTrackedAttr)
      updateFromPatch.notTrackedAttr.should.not.equal(updatedDoc.notTrackedAttr)
    })

    it('should return with an id based on the updated doc version number', () => {
      const patch = Patch.create({ userId, currentDoc, updatedDoc })
      patch._id.should.equal(`${updatedDoc._id}:${updatedDoc.version}`)
    })

    it('should accept an arbitrary context object', () => {
      const params = { userId, currentDoc, updatedDoc, context: { mergeFrom: 'bla' } }
      const patch = Patch.create(params)
      patch.should.be.an.Object()
      patch.type.should.equal('patch')
    })
  })

  describe('revert', () => {
    it('should revert a patch', () => {
      const patch = Patch.create({ userId, currentDoc, updatedDoc })
      const revertedDoc = Patch.revert(updatedDoc, patch)
      revertedDoc.labels.should.deepEqual(currentDoc.labels)
      revertedDoc.claims.should.deepEqual(currentDoc.claims)
    })

    it('should revert an update patch', () => {
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
    })

    it('should revert a patch between patches', () => {
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
    })

    it('should revert a patch between more patches', () => {
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
    })

    it('should revert a delete patch', () => {
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
    })

    it('should revert a delete patch after the doc was re-edited', () => {
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
    })

    it('should revert a patch between patches on different claims', () => {
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
    })

    it('should revert successive patches', () => {
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
    })
  })

  describe('addSnapshots', () => {
    it('should return an array of snapshots', () => {
      const base = Entity.create()
      const { patch, newVersion } = generateSomePatch(base)
      const patches = [ patch ]
      should(patch.snapshot).not.be.ok()
      Patch.addSnapshots(base, patches)
      patch.snapshot.should.be.an.Object()
      patch.snapshot.claims.should.deepEqual({})
      patch.snapshot.labels.en.should.equal(newVersion.labels.en)
    })

    it('should recover from disordered patches', () => {
      const base = Entity.create()

      let patches = []
      let i = 0
      let previousVersion = base
      while (i++ < 20) {
        const { patch, newVersion } = generateSomePatch(previousVersion)
        previousVersion = newVersion
        patches.push(patch)
      }

      patches = _.shuffle(patches)

      Patch.addSnapshots(base, patches)

      for (const patch of patches) {
        patch.snapshot.should.be.an.Object()
      }
    })
  })
})

const generateSomePatch = previousVersion => {
  const newVersion = _.cloneDeep(previousVersion)
  newVersion._id = validDocId
  newVersion.version++
  if (newVersion.labels.en) delete newVersion.labels.en
  else newVersion.labels = { en: randomString(6) }
  const patch = Patch.create({ userId, currentDoc: previousVersion, updatedDoc: newVersion })
  return { patch, newVersion }
}
