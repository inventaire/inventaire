const should = require('should')
const getBnfSeedFromIsbn = require('data/bnf/get_bnf_seed_from_isbn')

describe('get_bnf_seed_from_isbn', () => {
  it('should get an entry from a known ISBN', async () => {
    const entry = await getBnfSeedFromIsbn('978-2-207-11674-6')
    entry.edition.claims['wdt:P268'].should.equal('437169336')
    entry.works[0].claims['wdt:P268'].should.equal('12482666v')
    entry.authors[0].uri.should.equal('wd:Q123080')
    entry.authors[0].claims['wdt:P268'].should.equal('11895739q')
  })

  it('should not get an entry from an unknown ISBN', async () => {
    const entry = await getBnfSeedFromIsbn('978-3-9818987-4-3')
    should(entry).not.be.ok()
  })
})
