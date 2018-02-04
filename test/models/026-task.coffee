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
  elasticScore: 4.2
  relationScore: 4.2

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

    it 'should return scores', (done)->
      taskDoc = Task.create validDoc()
      taskDoc.elasticScore.should.equal validDoc().elasticScore
      taskDoc.relationScore.should.equal validDoc().relationScore
      done()

    it 'should throw if no score', (done)->
      invalidDoc = validDoc()
      delete invalidDoc.elasticScore
      taskDoc = -> Task.create invalidDoc
      try taskDoc()
      catch err then err.message.should.startWith 'invalid elasticScore'
      taskDoc.should.throw()
      done()

  describe 'update', ->
    it 'should update a valid task with an archived state', (done)->
      taskDoc = Task.update validDoc(), 'state', 'archived'
      taskDoc.state.should.equal 'archived'
      done()

    it 'should throw if invalid attribute to update', (done)->
      taskDoc = -> Task.update validDoc(), 'blob', 'archived'
      try taskDoc()
      catch err then err.message.should.startWith 'invalid attributes'
      taskDoc.should.throw()
      done()

    it 'should throw if invalid value', (done)->
      taskDoc = -> Task.update validDoc(), 'state', 'invalidValue'
      try taskDoc()
      catch err then err.message.should.startWith 'invalid state'
      taskDoc.should.throw()
      done()
