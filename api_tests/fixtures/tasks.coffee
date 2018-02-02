CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ authReq } = require '../utils/utils'
promises_ = __.require 'lib', 'promises'
randomString = __.require 'lib', './utils/random_string'
{ createHuman } = require './entities'

module.exports = API =
  createTask: (suspectUri)->
    getUriPromise suspectUri
    .then (suspectUri)->
      task =
        suspectUri: suspectUri
        suggestionUri: 'wd:Q12345'
        type: 'deduplicate'
        state: 'requested'
        elasticScore: 4

      authReq 'post', '/api/tasks?action=create', { tasks: [ task ] }

getUriPromise = (uri)->
  if uri? then return promises_.resolve uri
  return createHuman().then (human)->
    'inv:' + human._id
