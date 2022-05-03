const should = require('should')
const getBnbEntryFromIsbn = require('data/bnb/get_bnb_entry_from_isbn')

// BNB SPARQL service is currently suspended, see https://bnb.data.bl.uk/sparql:
// "The Linked Open BNB is moving to a new home in Spring 2022"

describe('get_bnb_entry_from_isbn', () => {
  xit('should get an entry from a known ISBN', async () => {
    const entry = await getBnbEntryFromIsbn('9781903765234')
    entry.edition.claims['wdt:P5199'].should.equal('012938091')
    entry.edition.claims['wdt:P407'].should.equal('wd:Q1860')
    entry.authors[0].claims['wdt:P5361'].should.equal('OBrienJim1950-')
    entry.authors[0].claims['wdt:P213'].should.equal('0000000067818190')
    entry.authors[0].claims['wdt:P214'].should.equal('75843307')
  })

  xit('should not get an entry from an unknown ISBN', async () => {
    const entry = await getBnbEntryFromIsbn('978-3-9818987-4-3')
    should(entry).not.be.ok()
  })
})
