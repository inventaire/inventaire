CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
Task = __.require 'models', 'task'

validDoc = ->
  type: 'deduplicate'
  suspectUri: 'inv:035a93cc360f4e285e955bc1230415c4'
  suggestionUri: 'wd:Q42'
  state: 'requested'
  lexicalScore: 4.2
  relationScore: 1
  hasEncyclopediaOccurence: true

describe 'task model', ->
  describe 'create', ->
    it 'should return an object with type', (done)->
      taskDoc = Task.create validDoc()
      taskDoc.should.be.an.Object()
      taskDoc.type.should.equal 'deduplicate'
      done()

    it 'should return suspectUri and a suggestionUri', (done)->
      taskDoc = Task.create validDoc()
      taskDoc.suspectUri.should.equal validDoc().suspectUri
      taskDoc.suggestionUri.should.equal validDoc().suggestionUri
      _.expired(taskDoc.created, 100).should.equal false
      done()

    it 'should throw if no suspect', (done)->
      invalidDoc =
        type: 'deduplicate'
        suggestionUri: 'wd:Q42'
      taskDoc = -> Task.create invalidDoc
      taskDoc.should.throw()
      done()

    it 'should throw if empty suspect', (done)->
      invalidDoc =
        type: 'deduplicate'
        suspectId: ''
        suggestionUri: 'wd:Q42'
      taskDoc = -> Task.create invalidDoc
      try taskDoc()
      catch err then err.message.should.startWith 'invalid suspect'
      taskDoc.should.throw()
      done()

    it 'should throw if no lexicalScore', (done)->
      invalidDoc = validDoc()
      delete invalidDoc.lexicalScore
      taskDoc = -> Task.create invalidDoc
      try taskDoc()
      catch err then err.message.should.startWith 'invalid lexicalScore'
      taskDoc.should.throw()
      done()

    it 'should throw if no relationScore', (done)->
      invalidDoc = validDoc()
      delete invalidDoc.relationScore
      taskDoc = -> Task.create invalidDoc
      try taskDoc()
      catch err then err.message.should.startWith 'invalid relationScore'
      taskDoc.should.throw()
      done()

    it 'should throw if no hasEncyclopediaOccurence', (done)->
      invalidDoc = validDoc()
      delete invalidDoc.hasEncyclopediaOccurence
      taskDoc = -> Task.create invalidDoc
      try taskDoc()
      catch err then err.message.should.startWith 'invalid hasEncyclopediaOccurence'
      taskDoc.should.throw()
      done()

  describe 'update', ->
    it 'should update a valid task with an dismissed state', (done)->
      taskDoc = Task.update validDoc(), 'state', 'dismissed'
      taskDoc.state.should.equal 'dismissed'
      done()

    it 'should throw if invalid attribute to update', (done)->
      taskDoc = -> Task.update validDoc(), 'blob', 'dismissed'
      try taskDoc()
      catch err then err.message.should.startWith 'invalid attribute'
      taskDoc.should.throw()
      done()

    it 'should throw if invalid value', (done)->
      taskDoc = -> Task.update validDoc(), 'state', 'invalidValue'
      try taskDoc()
      catch err then err.message.should.startWith 'invalid state'
      taskDoc.should.throw()
      done()
