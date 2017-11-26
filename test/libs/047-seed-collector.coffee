CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ createEntity} = require '../../api_tests/fixtures/entities'

checkSeedByAuthor = __.require 'controllers', 'tasks/lib/check_seed'

should = require 'should'

it 'should return a task with a type when seed with wd author is passed', (done)->
  createEntity('Les Misérables')
  .then (workseed)->
    checkSeedByAuthor(workseed)
    .then (res)->
      res.should.be.an.Array
      res[0].should.have.property('type')
      res[0].should.have.property('possibleDuplicates')
      done()
  return
