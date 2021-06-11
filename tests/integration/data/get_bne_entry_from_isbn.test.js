const should = require('should')
const getBneEntryFromIsbn = require('data/bne/get_bne_entry_from_isbn')

describe('get_bne_entry_from_isbn', () => {
  it('should get an entry from a known ISBN', async () => {
    const entry = await getBneEntryFromIsbn('978-84-261-2328-2')
    entry.edition.claims['wdt:P950'].should.equal('bimo0000048798')
    entry.edition.claims['wdt:P1476'].should.equal('O templo do sol')
    entry.edition.claims['wdt:P407'].should.equal('Q9307')
    entry.edition.claims['wdt:P1104'].should.equal(62)
    entry.edition.claims['wdt:P577'].should.equal('1988')
  })

  it('should not get an entry from an unknown ISBN', async () => {
    const entry = await getBneEntryFromIsbn('978-3-9818987-4-3')
    should(entry).not.be.ok()
  })

  it('should resolve same as matches', async () => {
    const entry = await getBneEntryFromIsbn('84-218-1182-7')
    entry.authors[0].uri.should.equal('wd:Q309945')
    entry.authors[0].claims['wdt:P950'].should.equal('XX887342')
    entry.authors[0].claims['wdt:P269'].should.equal('027069427')
    entry.authors[0].claims['wdt:P213'].should.equal('0000000121441313')
    entry.authors[0].claims['wdt:P214'].should.equal('95155932')
    entry.authors[0].claims['wdt:P227'].should.equal('109062353')
    entry.authors[0].claims['wdt:P244'].should.equal('n82047405')
    entry.authors[0].claims['wdt:P906'].should.equal('83651')
  })
})
