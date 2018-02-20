CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ authReq } = require '../utils/utils'
promises_ = __.require 'lib', 'promises'
randomString = __.require 'lib', './utils/random_string'
{ createHuman, createWorkWithAuthor } = require './entities'

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
        relationScore: 1

      authReq 'post', '/api/tasks?action=create', { tasks: [ task ] }

  createTaskWithSuggestionAuthor: (options)->
    { authorName, suggestionUri } = options

    authReq 'post', '/api/entities?action=create',
      labels: { fr: authorName }
      claims:
        'wdt:P31': [ 'wd:Q5' ]
    .then -> createWorkWithAuthor()
    .then (res)->
      suspectUri = 'inv:' + res._id
      task =
        suspectUri: suspectUri
        suggestionUri: suggestionUri
        type: 'deduplicate'
        state: 'requested'
        elasticScore: 4

      authReq 'post', '/api/tasks?action=create', { tasks: [ task ] }

getUriPromise = (uri)->
  if uri? then return promises_.resolve uri
  return createHuman().then (human)->
    'inv:' + human._id
