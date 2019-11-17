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
const slugify = __.require('controllers', 'groups/lib/slugify')

describe('slugify', () => {
  it('should be a function', done => {
    slugify.should.be.a.Function()
    done()
  })

  it('should take a string and return a string', done => {
    slugify('bla').should.be.a.String()
    slugify('bla&mémùémd ùdém^&²Mdù é:azdza').should.be.a.String()
    done()
  })

  it('should replace URL reserved characters', done => {
    slugify("L:a;:? M[!Y]$'@,\"|N=.E - é<(h)>o").should.equal('la-myn-e-ého')
    done()
  })

  it('should preserve non-ASCII characters', done => {
    slugify('『青チョークの男』').should.equal('『青チョークの男』')
    done()
  })

  it('should drop dashes at the extremities', done => {
    slugify('-hello-').should.equal('hello')
    slugify('?hello?').should.equal('hello')
    done()
  })
})
