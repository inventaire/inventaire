const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')

const search = __.require('controllers', 'search/lib/get_wd_authors')

describe('elastic query of an author name within indexes of wikidata humans', () => {
  it('only full phrase match should appear in result', async () => {
    const authorInWdDescriptions = {
      query: 'Karl Marx',
      goodId: 'Q9061', // => label: 'Karl Marx'
      lessGoodId: 'Q214986' // => label: 'Heinrich Marx'
    }

    const results = await search(authorInWdDescriptions.query, 'humans')
    const ids = _.map(results, '_id')
    ids.includes(authorInWdDescriptions.goodId).should.be.true()
    ids.includes(authorInWdDescriptions.lessGoodId).should.be.false()
  })
})
