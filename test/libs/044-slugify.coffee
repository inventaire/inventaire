CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

should = require 'should'
slugify = __.require 'controllers', 'groups/lib/slugify'

describe 'slugify', ->
  it 'should be a function', (done)->
    slugify.should.be.a.Function()
    done()

  it 'should take a string and return a string', (done)->
    slugify('bla').should.be.a.String()
    slugify('bla&mémùémd ùdém^&²Mdù é:azdza').should.be.a.String()
    done()

  it 'should replace URL reserved characters', (done)->
    slugify('L:a? M[!Y]$|N=.E - é<(h)>o').should.equal 'la-myn-e-ého'
    done()

  it 'should preserve non-ASCII characters', (done)->
    slugify('『青チョークの男』').should.equal '『青チョークの男』'
    done()
