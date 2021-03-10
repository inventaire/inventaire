// _ = __.require 'builders', 'utils'

// should = require 'should'

// Relation = require('models/relation')
// couch_ = __.require 'lib', 'couch'

// describe 'relation model', ->
//   it "should return a relation doc", (done)->
//     id1 = '31bdb23f92014ac20d60ce21eb00058e'
//     id2 = 'a26a7b36655232763e1591e498003fee'
//     docId = couch_.joinOrderedIds id1, id2
//     status = 'friends'
//     _.log relationDoc, 'relationDoc'
//     relationDoc = Relation.create docId, status
//     relationDoc.should.be.an.Object()
//     relationDoc._id.should.equal docId
//     relationDoc.status.should.equal status
//     relationDoc.type.should.equal 'relation'
//     done()

//   it "should throw on bad id", (done)->
//     id1 = 'invalidId'
//     id2 = 'a26a7b36655232763e1591e498003fee'
//     docId = couch_.joinOrderedIds id1, id2
//     status = 'friends'
//     (-> Relation.create(docId,status)).should.throw()
//     done()

//   it "should throw on unknow status", (done)->
//     id1 = '31bdb23f92014ac20d60ce21eb00058e'
//     id2 = 'a26a7b36655232763e1591e498003fee'
//     docId = couch_.joinOrderedIds id1, id2
//     status = 'bros'
//     (-> Relation.create(docId,status)).should.throw()
//     done()
