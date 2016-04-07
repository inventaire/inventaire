CONFIG = require('config')
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ expect } = require 'chai'
jiff = require 'jiff'

Patch = __.require 'models', 'patch'

validUserId = validDocId = '12345678900987654321123456789012'
rev = '1-d121066d145ea067b0c6638ebd050536'
doc = { a: 'aaa', b: [152, 1252], c: {d: 1}, _id: validDocId, _rev: rev }
update = { a: 'aa', b: [1, 12, 51], _id: validDocId, _rev: rev }

describe 'patch', ->
  describe 'create', ->
    it 'should throw if passed an invalid user id', (done)->
      create = Patch.create.bind(null, 'invalid user id', doc, update)
      expect(create).to.throw()
      done()

    it 'should throw if passed an updated doc without id', (done)->
      invalidDoc = _.extend {}, update, { _id: 'invalid id' }
      create = Patch.create.bind(null, validUserId, doc, invalidDoc)
      expect(create).to.throw()
      done()

    it 'should throw if passed an invalid doc object', (done)->
      create = Patch.create.bind(null, validUserId, 'not an object', doc)
      expect(create).to.throw()
      create = Patch.create.bind(null, validUserId, doc, 'not an object')
      expect(create).to.throw()
      done()

    it 'should return an object of type patch', (done)->
      patch = Patch.create validUserId, doc, update
      patch.should.be.an.Object()
      patch.type.should.equal 'patch'
      done()

    it 'should return with user set to the user passed', (done)->
      patch = Patch.create validUserId, doc, update
      patch.user.should.equal validUserId
      done()

    it 'should return with a timestamp', (done)->
      now = _.now()
      patch = Patch.create validUserId, doc, update
      patch.timestamp.should.be.a.Number()
      (patch.timestamp >= now).should.equal true
      done()

    it 'should return with a patch object', (done)->
      patch = Patch.create validUserId, doc, update
      patch.patch.should.be.an.Array()
      patch.patch.forEach (op)->
        op.should.be.an.Object()
        op.op.should.be.a.String()
        op.path.should.be.a.String()

      jiff.patch(patch.patch, doc).should.deepEqual update
      done()

    it 'should return with an _id built from the document id and the version', (done)->
      patch = Patch.create validUserId, doc, update
      docId = update._id
      version = update._rev.split('-')[0]
      patch._id.split(':')[0].should.equal docId
      patch._id.split(':')[1].should.equal version
      done()