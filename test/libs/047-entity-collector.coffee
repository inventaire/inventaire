CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

createHuman = (label)->
  _id: '91760e03c9c367c3fd75655532f4b2f6'
  type: "human"
  labels: { en: label },
  claims: { 'wdt:P31': [ 'wd:Q5' ] }

checkEntity = __.require 'controllers', 'tasks/lib/check_entity'

should = require 'should'

it 'should not return any task when a randomString entity label is passed', (done)->
  author = createHuman "GgM5sjJhUperiV6QFZ"
  checkEntity author
  .then (res)-> res.tasks.should.empty() ; done()
  return

it 'should return a task with a type, suspectUri & suggestionUri for unique named authors', (done)->
  author = createHuman 'Stanislas Lem'
  checkEntity author
  .then (res)->
    res.tasks[0].should.have.property 'type'
    res.tasks[0].should.have.property 'suspectUri'
    res.tasks[0].should.have.property 'suggestionUri'
    res.tasks[0]['suggestionUri'].should.equal "wd:Q6530"
    res.tasks.should.have.size 1
    done()
  return

it 'should not create a task if author have homonyms', (done)->
  author = createHuman 'Scott Johnson'
  checkEntity author
  .then (res)-> res.tasks.should.be.empty() ; done()
  return
