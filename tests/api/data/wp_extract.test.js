// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
require('should')
const { nonAuthReq } = require('../utils/utils')

describe('wikipedia:extract', () => it('should get an extract of a Wikipedia article', done => {
  nonAuthReq('get', '/api/data?action=wp-extract&lang=fr&title=Gilbert_Simondon')
  .then(res => {
    res.url.should.equal('https://fr.wikipedia.org/wiki/Gilbert_Simondon')
    res.extract.should.startWith('Gilbert Simondon')
    done()
  })
  .catch(done)
}))
