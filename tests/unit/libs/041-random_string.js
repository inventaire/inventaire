// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath

require('should')
const randomString = __.require('lib', 'utils/random_string')

describe('random string', () => it('should return a string of the requested length', done => {
  randomString(2).length.should.equal(2)
  randomString(32).length.should.equal(32)
  randomString(623).length.should.equal(623)
  done()
}))
