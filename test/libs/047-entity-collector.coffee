CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ createEntity, createWork } = require '../../api_tests/fixtures/entities'

checkEntity = __.require 'controllers', 'tasks/lib/check_entity'

should = require 'should'

it 'should return a task with a type suspectUri & suggestionUri', (done)->
  createEntity('Les Misérables')
  .then (workseed)->
    checkEntity workseed
    .then (res)->
      res.tasks.should.be.an.Array
      res.tasks[0].should.have.property 'type'
      res.tasks[0].should.have.property 'suspectUri'
      res.tasks[0].should.have.property 'suggestionUri'
    .then ()-> done()
  return
