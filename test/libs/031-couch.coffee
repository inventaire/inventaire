CONFIG = require('config')
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

should = require 'should'

couch_ = __.require 'lib', 'couch'

describe 'couch_', ->
  it "env", (done)->
    couch_.should.be.an.Object
    done()

  describe 'joinOrderedIds', ->
    it "should return ordered id", (done)->
      id1 = couch_.joinOrderedIds 'azerty', 'qwerty'
      id1.should.equal 'azerty:qwerty'
      id2 = couch_.joinOrderedIds 'qwerty', 'azerty'
      id2.should.equal 'azerty:qwerty'
      id3 = couch_.joinOrderedIds 'qwerty', '15hello'
      id3.should.equal '15hello:qwerty'
      done()
