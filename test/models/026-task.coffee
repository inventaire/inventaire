CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'

Task = __.require 'models', 'task'

validDoc =
  _id: '12345678900987654321123456789012'
  suspectUri: 'inv:035a93cc360f4e285e955bc1230415c4'
  suggestionUri: 'wd:Q42'

describe 'task model', ->
  describe 'create', ->
    it 'should return an object with type task', (done)->
      taskDoc = Task.create(validDoc.suspectUri, validDoc.suggestionUri)
      taskDoc.should.be.an.Object()
      taskDoc.type.should.equal 'task'
      done()

    it 'should return possible duplicates from one entity suspect and a suggestion to replace it', (done)->
      taskDoc = Task.create(validDoc.suspectUri, validDoc.suggestionUri)
      taskDoc.suspectUri.should.equal validDoc.suspectUri
      taskDoc.suggestionUri.should.equal validDoc.suggestionUri
      _.expired(taskDoc.created, 100).should.equal false
      done()

    it 'should throw if suspect is an empty string', (done)->
      taskDoc = -> Task.create("", validDoc.suggestionUri)
      taskDoc.should.throw()
      done()

