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
    entry.authors[0].claims['wdt:P648'].should.equal('OL9962491A')
  })
})
