require('should')
const getOpenLibraryEntryFromIsbn = require('data/openlibrary/get_openlibrary_entry_from_isbn')

describe('get_openlibrary_entry_from_isbn', () => {
  it('should get an entry from an ISBN', async () => {
    const entry = await getOpenLibraryEntryFromIsbn('978-83-7392-682-0')
    entry.edition.claims['wdt:P648'].should.equal('OL35721067M')
    entry.edition.claims['wdt:P577'].should.equal('2020-12-21')
    entry.edition.claims['wdt:P1104'].should.equal(250)
    entry.edition.image.should.equal('https://covers.openlibrary.org/b/id/12457215-L.jpg?default=false')
    entry.works[0].claims['wdt:P648'].should.equal('OL26437584W')
    entry.works[0].labels.en.should.be.a.String()
    entry.authors[0].claims['wdt:P648'].should.equal('OL9962491A')
  })

  it('should find entries with only ISBN-10 from an ISBN-13', async () => {
    const entry = await getOpenLibraryEntryFromIsbn('978-2-7152-1841-3')
    entry.edition.claims['wdt:P648'].should.equal('OL914930M')
    entry.edition.claims['wdt:P1144'].should.equal('95211094')
  })

  it('should support year precision', async () => {
    const entry = await getOpenLibraryEntryFromIsbn('978-2-7152-1841-3')
    entry.edition.claims['wdt:P577'].should.equal('1993')
  })

  it('should resolve the publisher', async () => {
    const entry = await getOpenLibraryEntryFromIsbn('978-3-99039-208-9')
    entry.edition.claims['wdt:P123'].should.equal('wd:Q1825404')
  })

  it('should import identifiers', async () => {
    const entry = await getOpenLibraryEntryFromIsbn('9782912107176')
    entry.edition.claims['wdt:P648'].should.equal('OL12654422M')
    entry.edition.claims['wdt:P2969'].should.equal('4872992')
    entry.works[0].claims['wdt:P648'].should.equal('OL10012680W')
    entry.works[0].claims['wdt:P1085'].should.equal('8117078')
    entry.authors[0].claims['wdt:P648'].should.equal('OL3979402A')
  })
})
