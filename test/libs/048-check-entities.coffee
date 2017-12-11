CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
randomString = __.require 'lib', 'utils/random_string'

createHuman = (label)->
  _id: '91760e03c9c367c3fd75655532f4b2f6'
  type: "human"
  labels: { en: label },
  claims: { 'wdt:P31': [ 'wd:Q5' ] }

checkEntities = __.require 'controllers', 'tasks/lib/check_entities'

it 'should return an array of tasks when multiple entities are passed', (done)->
  entities = [
    createHuman 'Stanislas Lem'
  ]
  checkEntities(entities)
  .then (res)->
    res.should.be.an.Object()
    res.should.equal {"foo"}
    done()
  return
