
import 'should'
import slugify from '#controllers/groups/lib/slugify'

describe('slugify', () => {
  it('should be a function', () => {
    slugify.should.be.a.Function()
  })

  it('should take a string and return a string', () => {
    slugify('bla').should.be.a.String()
    slugify('bla&mémùémd ùdém^&²Mdù é:azdza').should.be.a.String()
  })

  it('should replace URL reserved characters', () => {
    slugify("L:a;:? M[!Y]$'@,\"|N=.E - é<(}{h)/\\>o").should.equal('la-myn-e-ého')
    slugify('/Â§"$%&/)?=)( yes!').should.equal('â-yes')
  })

  it('should preserve non-ASCII characters', () => {
    slugify('『青チョークの男』').should.equal('青チョークの男')
  })

  it('should drop dashes at the extremities', () => {
    slugify('---hel-----lo-----').should.equal('hel-lo')
    slugify('?hello?').should.equal('hello')
  })
})
