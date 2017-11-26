CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ nonAuthReq, getUser, adminReq, undesiredErr } = require '../utils/utils
'
randomString = __.require 'lib', './utils/random_string'
{ createWork } = require '../fixtures/entities'
endpoint = '/api/entities?action=search-type'

describe 'entities:search-type', ->
  it 'should return a recently created entity', (done)->
    label = randomString(10)
    createWork { labels: { fr: label } }
    .delay 1000
    .then (creationRes)->
      createdWorkId = creationRes._id
      nonAuthReq 'get', "#{endpoint}&type=works&search=#{label}&lang=fr"
      .then (results)->
        worksIds = _.pluck results, '_id'
        (createdWorkId in worksIds).should.be.true()
        results[0].uri.should.be.ok()
        done()
    .catch undesiredErr(done)

    return
