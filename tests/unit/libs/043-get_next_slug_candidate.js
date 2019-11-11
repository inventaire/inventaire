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

const should = require('should')
const getNextSlugCandidate = __.require('controllers', 'groups/lib/get_next_slug_candidate')

describe('get next slug candidate', () => it('should return an iterated slug', (done) => {
  getNextSlugCandidate('hello').should.equal('hello.1')
  getNextSlugCandidate('hello.1').should.equal('hello.2')
  getNextSlugCandidate('hello.15').should.equal('hello.16')
  getNextSlugCandidate('hello.15.2').should.equal('hello.15.3')
  getNextSlugCandidate('hel.lo.15.20199124').should.equal('hel.lo.15.20199125')
  return done()
}))
