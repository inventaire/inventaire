// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
const __ = require('config').universalPath
const ActionsControllers = __.require('lib', 'actions_controllers')

module.exports = {
  get: ActionsControllers({
    public: {
      // 'wd-query': __.require 'data', 'wikidata/query'
      'wp-extract': __.require('data', 'wikipedia/extract'),
      isbn: __.require('data', 'isbn')
    }
  })
}
