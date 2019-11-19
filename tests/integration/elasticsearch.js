// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')

const search = __.require('controllers', 'search/lib/get_wd_authors')

describe('elastic query of an author name within indexes of wikidata humans', () => it('only full phrase match should appear in result', done => {
  const authorInWdDescriptions = {
    query: 'Karl Marx',
    goodId: 'Q9061', // => label: 'Karl Marx'
    lessGoodId: 'Q214986' // => label: 'Heinrich Marx'
  }

  search(authorInWdDescriptions.query, 'humans')
  .then(results => {
    const goodResult = _.find(results, { _id: authorInWdDescriptions.goodId })
    const badResult = _.find(results, { _id: authorInWdDescriptions.lessGoodId })

    const ids = _.map(results, '_id')
    ids.includes(authorInWdDescriptions.goodId).should.be.true()
    ids.includes(authorInWdDescriptions.lessGoodId).should.be.false()

    done()
  })
}))
