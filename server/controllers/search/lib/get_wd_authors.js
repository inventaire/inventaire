// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const { buildSearcher } = __.require('lib', 'elasticsearch')

const index = 'wikidata'

const queryBodyBuilder = title => ({
  query: {
    bool: {
      should: [
        {
        // boost policy : 'Aaron Swartz' > ( 'Aaron' AND 'Swartz' )
        // type 'phrase' == exact match of full query aka 'Aaron Swartz'
          multi_match: {
            query: title,
            type: 'phrase',
            fields: [ 'labels.*' ],
            boost: 5
          }
        },
        {
        // operator AND == can match 'Aaron Michael Swartz'
          multi_match: {
            query: title,
            fields: [ 'labels.*', 'aliases.*' ],
            operator: 'and',
            boost: 2
          }
        }
      ]
    }
  }
})

module.exports = buildSearcher({ index, queryBodyBuilder })
