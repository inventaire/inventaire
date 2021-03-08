const CONFIG = require('config')
const __ = CONFIG.universalPath

require('should')
const getNextSlugCandidate = require('controllers/groups/lib/get_next_slug_candidate')

describe('get next slug candidate', () => {
  it('should return an iterated slug', () => {
    getNextSlugCandidate('hello').should.equal('hello.1')
    getNextSlugCandidate('hello.1').should.equal('hello.2')
    getNextSlugCandidate('hello.15').should.equal('hello.16')
    getNextSlugCandidate('hello.15.2').should.equal('hello.15.3')
    getNextSlugCandidate('hel.lo.15.20199124').should.equal('hel.lo.15.20199125')
  })
})
