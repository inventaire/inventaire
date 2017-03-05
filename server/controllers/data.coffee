__ = require('config').universalPath
_ = __.require 'builders', 'utils'
ActionsControllers = __.require 'lib', 'actions_controllers'
error_ = __.require 'lib', 'error/error'

module.exports =
  get: ActionsControllers
    public:
      # 'wd-query': __.require 'data', 'wikidata/query'
      'wp-extract': __.require 'data', 'wikipedia/extract'
      'isbn': __.require 'data', 'isbn'
