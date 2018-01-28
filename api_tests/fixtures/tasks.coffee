CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ authReq } = require '../utils/utils'

module.exports = API =
  createTask: (suspectUri)->
    task =
      suspectUri: suspectUri
      suggestionUri: 'wd:Q12345'
      type: 'deduplicate'
      state: 'requested'

    authReq 'post', '/api/tasks?action=create', { tasks: [ task ] }
