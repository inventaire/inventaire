CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
jiff = require 'jiff'

Patch = __.require 'models', 'patch'

userId = validDocId = '12345678900987654321123456789012'
rev = '1-d121066d145ea067b0c6638ebd050536'
currentDoc =
  _id: validDocId
  _rev: rev
  labels:
    fr: 'yo'
  claims:
    P31: ['Q571']
    P50: ['Q535']
  notTrackedAttr: 123

updatedDoc =
  _id: validDocId
  _rev: rev
  labels:
    en: 'da'
  claims:
    P31: ['Q571']
    P50: ['Q535', 'Q2001']
    P135: ['Q53121']
  notTrackedAttr: 456

authorDoc =
  _id: '42d699b333a86f2506208e7e6d0671cc'
  _rev: '4-760b982ea416be33c6938774db2cfaeb'
  type: 'entity'
  labels: { en: 'GBKaRq' }
  claims: { 'wdt:P31': [ 'wd:Q571' ] }

describe 'patch', ->
  describe 'create', ->
    it 'should throw if passed an invalid user id', (done)->
      params =
      (-> Patch.create { userId: 'invalid user id', currentDoc, updatedDoc })
      .should.throw()
      done()

    it 'should throw if passed identical objects', (done)->
      (-> Patch.create { userId, currentDoc, updatedDoc: currentDoc })
      .should.throw()
      done()

    it 'should throw if there are no changes', (done)->
      docClone = _.cloneDeep currentDoc
      (-> Patch.create { userId, currentDoc, updatedDoc: docClone })
      .should.throw()
      done()

    it 'should throw if passed an updated doc without id', (done)->
      invalidDoc = _.extend {}, updatedDoc, { _id: 'invalid id' }
      (-> Patch.create { userId, currentDoc, updatedDoc: invalidDoc })
      .should.throw()
      done()

    it 'should throw if passed an invalid doc object', (done)->
      (-> Patch.create { userId, currentDoc: 'not an object', updatedDoc })
      .should.throw()
      (-> Patch.create { userId, currentDoc, updatedDoc: 'not an object' })
      .should.throw()
      done()

    it 'should return an object of type patch', (done)->
      patch = Patch.create { userId, currentDoc, updatedDoc }
      patch.should.be.an.Object()
      patch.type.should.equal 'patch'
      done()

    it 'should return with user set to the user passed', (done)->
      patch = Patch.create { userId, currentDoc, updatedDoc }
      patch.user.should.equal userId
      done()

    it 'should return with a timestamp', (done)->
      now = _.now()
      patch = Patch.create { userId, currentDoc, updatedDoc }
      patch.timestamp.should.be.a.Number()
      (patch.timestamp >= now).should.equal true
      done()

    it 'should return with a patch object', (done)->
      patch = Patch.create { userId, currentDoc, updatedDoc }
      patch.patch.should.be.an.Array()
      patch.patch.forEach (op)->
        op.should.be.an.Object()
        op.op.should.be.a.String()
        op.path.should.be.a.String()

      updateFromPatch = jiff.patch patch.patch, currentDoc
      updateFromPatch.claims.should.deepEqual updatedDoc.claims
      updateFromPatch.labels.should.deepEqual updatedDoc.labels
      done()

    it 'should ignore data out of versionned attributes', (done)->
      patch = Patch.create { userId, currentDoc, updatedDoc }
      updateFromPatch = jiff.patch patch.patch, currentDoc
      updateFromPatch.notTrackedAttr.should.equal currentDoc.notTrackedAttr
      updateFromPatch.notTrackedAttr.should.not.equal updatedDoc.notTrackedAttr
      done()

    it 'should return with an _id built from the document id and the version', (done)->
      patch = Patch.create { userId, currentDoc, updatedDoc }
      docId = updatedDoc._id
      version = updatedDoc._rev.split('-')[0]
      patch._id.split(':')[0].should.equal docId
      patch._id.split(':')[1].should.equal version
      done()

    it 'should accept an arbitrary context object', (done)->
      params = { userId, currentDoc, updatedDoc, context: { mergeFrom: 'bla' } }
      patch = Patch.create params
      patch.should.be.an.Object()
      patch.type.should.equal 'patch'
      done()

  describe 'revert', ->
    it 'should revert a patch', (done)->
      patch = Patch.create { userId, currentDoc, updatedDoc }
      revertedDoc = Patch.revert updatedDoc, patch
      revertedDoc.labels.should.deepEqual currentDoc.labels
      revertedDoc.claims.should.deepEqual currentDoc.claims
      done()

    it 'should revert an update patch', (done)->
      authorDocUpdatedA = _.cloneDeep authorDoc
      authorDocUpdatedA.claims['wdt:P50'] = [ 'wd:Q535' ]
      authorDocUpdatedB = _.cloneDeep authorDocUpdatedA
      authorDocUpdatedB.claims['wdt:P50'] = [ 'wd:Q184226' ]
      patchB = Patch.create
        userId: userId
        currentDoc: authorDocUpdatedA
        updatedDoc: authorDocUpdatedB

      revertedDoc = Patch.revert authorDocUpdatedB, patchB
      revertedDoc.claims['wdt:P50'].should.deepEqual [ 'wd:Q535' ]
      done()

    it 'should revert a patch between patches', (done)->
      authorDocUpdatedA = _.cloneDeep authorDoc
      authorDocUpdatedA.claims['wdt:P50'] = [ 'wd:Q535' ]
      patchA = Patch.create
        userId: userId
        currentDoc: authorDoc
        updatedDoc: authorDocUpdatedA

      authorDocUpdatedB = _.cloneDeep authorDocUpdatedA
      authorDocUpdatedB.claims['wdt:P50'].push 'wd:Q184226'

      revertedDoc = Patch.revert authorDocUpdatedB, patchA
      revertedDoc.claims['wdt:P50'].should.deepEqual [ 'wd:Q184226' ]
      done()

    it 'should revert a patch between more patches', (done)->
      authorDocUpdatedA = _.cloneDeep authorDoc
      authorDocUpdatedA.claims['wdt:P50'] = [ 'wd:Q535' ]

      authorDocUpdatedB = _.cloneDeep authorDocUpdatedA
      authorDocUpdatedB.claims['wdt:P50'].push 'wd:Q184226'
      patchB = Patch.create
        userId: userId
        currentDoc: authorDocUpdatedA
        updatedDoc: authorDocUpdatedB

      authorDocUpdatedC = _.cloneDeep authorDocUpdatedB
      authorDocUpdatedC.claims['wdt:P50'].push 'wd:Q237087'

      revertedDoc = Patch.revert authorDocUpdatedC, patchB
      revertedDoc.claims['wdt:P50'].should.deepEqual [ 'wd:Q535', 'wd:Q237087' ]
      done()

    it 'should revert a delete patch', (done)->
      authorDocUpdatedA = _.cloneDeep authorDoc
      authorDocUpdatedA.claims['wdt:P50'] = [ 'wd:Q535' ]

      authorDocUpdatedB = _.cloneDeep authorDocUpdatedA
      delete authorDocUpdatedB.claims['wdt:P50']
      patchB = Patch.create
        userId: userId
        currentDoc: authorDocUpdatedA
        updatedDoc: authorDocUpdatedB

      revertedDoc = Patch.revert authorDocUpdatedB, patchB
      revertedDoc.claims['wdt:P50'].should.deepEqual [ 'wd:Q535' ]
      done()

    it 'should revert a delete patch after the doc was re-edited', (done)->
      authorDocUpdatedA = _.cloneDeep authorDoc
      authorDocUpdatedA.claims['wdt:P50'] = [ 'wd:Q535' ]

      authorDocUpdatedB = _.cloneDeep authorDocUpdatedA
      delete authorDocUpdatedB.claims['wdt:P50']
      patchB = Patch.create
        userId: userId
        currentDoc: authorDocUpdatedA
        updatedDoc: authorDocUpdatedB

      authorDocUpdatedC = _.cloneDeep authorDocUpdatedB
      authorDocUpdatedC.claims['wdt:P50'] = [ 'wd:Q237087' ]

      revertedDoc = Patch.revert authorDocUpdatedC, patchB
      revertedDoc.claims['wdt:P50'].should.deepEqual [ 'wd:Q237087', 'wd:Q535' ]
      done()

    it 'should revert a patch between patches on different claims', (done)->
      authorDocUpdatedA = _.cloneDeep authorDoc
      authorDocUpdatedA.claims['wdt:P50'] = [ 'wd:Q535' ]

      authorDocUpdatedB = _.cloneDeep authorDocUpdatedA
      authorDocUpdatedB.claims['wdt:P58'] = [ 'wd:Q184226' ]
      delete authorDocUpdatedB.claims['wdt:P50']
      patchB = Patch.create
        userId: userId
        currentDoc: authorDocUpdatedA
        updatedDoc: authorDocUpdatedB

      revertedDoc = Patch.revert authorDocUpdatedB, patchB
      revertedDoc.claims['wdt:P50'].should.deepEqual [ 'wd:Q535' ]
      should(revertedDoc.claims['wdt:P58']).not.be.ok()
      done()

    it 'should revert successive patches', (done)->
      authorDocUpdatedA = _.cloneDeep authorDoc
      authorDocUpdatedA.claims['wdt:P50'] = [ 'wd:Q535' ]

      authorDocUpdatedB = _.cloneDeep authorDocUpdatedA
      authorDocUpdatedB.claims['wdt:P50'].push 'wd:Q184226'
      patchB = Patch.create
        userId: userId
        currentDoc: authorDocUpdatedA
        updatedDoc: authorDocUpdatedB

      authorDocUpdatedC = _.cloneDeep authorDocUpdatedB
      authorDocUpdatedC.claims['wdt:P50'].push 'wd:Q42'
      patchC = Patch.create
        userId: userId
        currentDoc: authorDocUpdatedB
        updatedDoc: authorDocUpdatedC

      revertedDoc = Patch.revert authorDocUpdatedC, patchB
      revertedDoc.claims['wdt:P50'].should.deepEqual [ 'wd:Q535', 'wd:Q42' ]

      # Tests that the revert works despite the patch keeping an outdated
      # index of the value
      revertedDoc = Patch.revert revertedDoc, patchC
      revertedDoc.claims['wdt:P50'].should.deepEqual [ 'wd:Q535' ]

      done()
