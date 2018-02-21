CONFIG = require('config')
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
should = require 'should'

search = __.require 'controllers', 'search/lib/get_wd_authors'

authorsWithLongerName =
  search: -> search "Zach Weinersmith", 'humans'
  lessGoodId: 'Q3574507' # => Zach Weiner

describe 'elastic query of an author name within indexes of wikidata humans', ->
  it "only full phrase match should appear in result", (done)->
    authorInWdDescriptions =
      query: 'Karl Marx'
      goodId: 'Q9061'  # => label: 'Karl Marx'
      lessGoodId: 'Q214986' # => label: 'Heinrich Marx'

    search authorInWdDescriptions.query, 'humans'
    .then (res) ->
      goodResult = _.find(res, {_id: authorInWdDescriptions.goodId})
      badResult = _.find(res, {_id: authorInWdDescriptions.lessGoodId})

      ids = _.map(res, "_id")
      ids.includes(authorInWdDescriptions.goodId).should.be.true()
      ids.includes(authorInWdDescriptions.lessGoodId).should.be.false()

      done()

    return

