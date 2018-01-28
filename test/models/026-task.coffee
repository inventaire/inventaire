CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'

Task = __.require 'models', 'task'

validDoc = ->
  type: 'deduplicate'
  suspectUri: 'inv:035a93cc360f4e285e955bc1230415c4'
  suggestionUri: 'wd:Q42'
  elasticScore: 4.2
  probability: 4.2

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
      taskDoc = -> Task.create(invalidDoc.suggestionUri)
      taskDoc.should.throw()
      done()

    it 'should throw if empty suspect', (done)->
      invalidDoc =
        type: 'deduplicate'
        suspectId: ""
        suggestionUri: 'wd:Q42'
      taskDoc = -> Task.create invalidDoc
      taskDoc.should.throw()
      done()

    it 'should return scores', (done)->
      taskDoc = Task.create validDoc()
      taskDoc.elasticScore.should.equal validDoc().elasticScore
      taskDoc.probability.should.equal validDoc().probability
      done()
