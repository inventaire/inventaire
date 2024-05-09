import 'should'
import getOpenLibraryEntryFromIsbn from '#data/openlibrary/get_openlibrary_entry_from_isbn'
import { simpleDay } from '#lib/utils/base'

describe('get_openlibrary_entry_from_isbn', () => {
  it('should get an entry from an ISBN', async () => {
    const entry = await getOpenLibraryEntryFromIsbn('978-83-7392-682-0')
    entry.edition.claims['wdt:P648'].should.deepEqual([ { value: 'OL35721067M' } ])
    const reference = {
      'wdt:P648': [ 'OL35721067M' ],
      'wdt:P813': [ simpleDay() ],
    }
    entry.edition.claims['wdt:P577'].should.deepEqual([ { value: '2020-12-21', references: [ reference ] } ])
    entry.edition.claims['wdt:P1104'].should.deepEqual([ { value: 250, references: [ reference ] } ])
    entry.edition.image.should.equal('https://covers.openlibrary.org/b/id/12457215-L.jpg?default=false')
    entry.works[0].claims['wdt:P648'].should.deepEqual([ { value: 'OL26437584W' } ])
    entry.works[0].labels.en.should.be.a.String()
    entry.authors[0].claims['wdt:P648'].should.deepEqual([ { value: 'OL9962491A' } ])
  })

  it('should find entries with only ISBN-10 from an ISBN-13', async () => {
    const entry = await getOpenLibraryEntryFromIsbn('978-2-7152-1841-3')
    entry.edition.claims['wdt:P648'].should.deepEqual([ { value: 'OL914930M' } ])
    const reference = {
      'wdt:P648': [ 'OL914930M' ],
      'wdt:P813': [ simpleDay() ],
    }
    entry.edition.claims['wdt:P1144'].should.deepEqual([ { value: '95211094', references: [ reference ] } ])
  })

  it('should support year precision', async () => {
    const entry = await getOpenLibraryEntryFromIsbn('978-2-7152-1841-3')
    const reference = {
      'wdt:P648': [ 'OL914930M' ],
      'wdt:P813': [ simpleDay() ],
    }
    entry.edition.claims['wdt:P577'].should.deepEqual([ { value: '1993', references: [ reference ] } ])
  })

  it('should resolve the publisher', async () => {
    const entry = await getOpenLibraryEntryFromIsbn('978-3-99039-208-9')
    const reference = {
      'wdt:P648': [ 'OL35403091M' ],
      'wdt:P813': [ simpleDay() ],
    }
    entry.edition.claims['wdt:P123'].should.deepEqual([ { value: 'wd:Q1825404', references: [ reference ] } ])
  })

  it('should import identifiers', async () => {
    const entry = await getOpenLibraryEntryFromIsbn('9782912107176')
    const editionReference = {
      'wdt:P648': [ 'OL12654422M' ],
      'wdt:P813': [ simpleDay() ],
    }
    entry.edition.claims['wdt:P648'].should.deepEqual([ { value: 'OL12654422M' } ])
    entry.edition.claims['wdt:P2969'].should.deepEqual([ { value: '4872992', references: [ editionReference ] } ])
    const workReference = {
      'wdt:P648': [ 'OL10012680W' ],
      'wdt:P813': [ simpleDay() ],
    }
    entry.works[0].claims['wdt:P648'].should.deepEqual([ { value: 'OL10012680W' } ])
    entry.works[0].claims['wdt:P1085'].should.deepEqual([ { value: '8117078', references: [ workReference ] } ])
    entry.authors[0].claims['wdt:P648'].should.deepEqual([ { value: 'OL3979402A' } ])
  })
})
