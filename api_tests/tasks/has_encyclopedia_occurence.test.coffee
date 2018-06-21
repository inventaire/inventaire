CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ authReq, adminReq, nonAuthReq, undesiredErr } = __.require 'apiTests', 'utils/utils'
{ collectEntities } = require '../fixtures/tasks'
{ getByScore } = require '../utils/tasks'

describe 'tasks:has-encyclopedia-occurence', ->
  it 'should return true when author has work sourced in their wikipedia page', (done)->
    authReq 'post', '/api/entities?action=create',
      labels: { en: 'Victor Hugo' }
      claims:
        'wdt:P31': [ 'wd:Q5' ]
    .then (res)->
      authorUri = "inv:#{res._id}"
      authReq 'post', '/api/entities?action=create',
        labels: { en: 'Ruy Blas' }
        claims:
          'wdt:P31': [ 'wd:Q571' ]
          'wdt:P50': [ authorUri ]
      .then -> collectEntities { refresh: true }
      .delay 5000
      .then getByScore
      .then (tasks)->
        tasks.length.should.aboveOrEqual 1
        hasEncyclopediaOccurences = _.pluck tasks, 'hasEncyclopediaOccurence'
        _.includes(hasEncyclopediaOccurences, true).should.be.true()
        done()
      .catch undesiredErr(done)

    return
