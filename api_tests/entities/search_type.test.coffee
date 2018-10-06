CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ nonAuthReq, undesiredErr } = require '../utils/utils'
{ createWork, workLabel } = require '../fixtures/entities'
endpoint = '/api/entities?action=search-type'

describe 'entities:search-type', ->
  it 'should return a recently created entity', (done)->
    label = workLabel()
    createWork { labels: { fr: label } }
    .delay 1000
    .then (creationRes)->
      createdWorkId = creationRes._id
      nonAuthReq 'get', "#{endpoint}&type=works&search=#{label}&lang=fr"
      .get 'results'
      .then (results)->
        worksIds = _.pluck results, '_id'
        (createdWorkId in worksIds).should.be.true()
        results[0].uri.should.be.ok()
        done()
    .catch undesiredErr(done)

    return
