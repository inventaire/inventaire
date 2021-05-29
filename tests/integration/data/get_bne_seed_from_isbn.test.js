const should = require('should')
const getBneSeedFromIsbn = require('data/bne/get_bne_seed_from_isbn')

describe('get_bne_seed_from_isbn', () => {
  it('should get an entry from a known ISBN', async () => {
    const entry = await getBneSeedFromIsbn('978-84-261-2328-2')
    entry.edition.claims['wdt:P950'].should.equal('bimo0000048798')
    entry.edition.claims['wdt:P1476'].should.equal('O templo do sol')
    entry.edition.claims['wdt:P407'].should.equal('Q9307')
    entry.edition.claims['wdt:P1104'].should.equal(62)
    entry.edition.claims['wdt:P577'].should.equal('1988')
  })

  it('should not get an entry from an unknown ISBN', async () => {
    const entry = await getBneSeedFromIsbn('978-3-9818987-4-3')
    should(entry).not.be.ok()
  })
})
