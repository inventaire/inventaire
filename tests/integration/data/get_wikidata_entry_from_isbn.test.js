import should from 'should'
import getWikidataEntryFromIsbn from '#data/wikidata/get_wikidata_entry_from_isbn'

describe('get_wikidata_entry_from_isbn', () => {
  it('should get an entry from a known ISBN: ISBN statement on an edition', async () => {
    // Assuming the existance of the triple: wd:Q57985371 wdt:P212 "978-94-6356-079-5"
    const entry = await getWikidataEntryFromIsbn('9789463560795')
    entry.edition.claims['wdt:P1476'].should.equal('Schrijven voor Wikipedia')
    entry.works[0].uri.should.equal('wd:Q56762209')
  })

  it('should get an entry from a known ISBN: ISBN statement on a work', async () => {
    // Assuming the existance of the triple: wd:Q482418 wdt:P212 "978-2-8004-1508-6"
    const entry = await getWikidataEntryFromIsbn('978-2-8004-1508-6')
    entry.edition.claims['wdt:P1476'].should.equal('An Economic Theory of Democracy')
    entry.works[0].uri.should.equal('wd:Q482418')
  })

  it('should not get an entry from an unknown ISBN', async () => {
    const entry = await getWikidataEntryFromIsbn('978-3-9818987-4-3')
    should(entry).not.be.ok()
  })
})
