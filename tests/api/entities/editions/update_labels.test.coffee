CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ undesiredRes, undesiredErr } = require '../../utils/utils'
{ updateLabel } = require '../../utils/entities'
{ createEdition, workLabel } = require '../../fixtures/entities'

describe 'entities:editions:update-labels', ->
  it 'should reject labels update', (done)->
    createEdition()
    .then (edition)->
      updateLabel edition._id, 'fr', workLabel()
      .then undesiredRes(done)
      .catch (err)->
        err.body.status_verbose.should.equal "editions can't have labels"
        err.statusCode.should.equal 400
        done()
    .catch undesiredErr(done)

    return
