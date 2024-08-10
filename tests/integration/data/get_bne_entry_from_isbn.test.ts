import should from 'should'
import getBneEntryFromIsbn from '#data/bne/get_bne_entry_from_isbn'
import { simpleDay } from '#lib/utils/base'

describe('get_bne_entry_from_isbn', () => {
  it('should get an entry from a known ISBN', async () => {
    const reference = {
      'wdt:P950': [ 'bimo0000048798' ],
      'wdt:P813': [ simpleDay() ],
    }
    const entry = await getBneEntryFromIsbn('978-84-261-2328-2')
    entry.edition.claims['wdt:P950'].should.deepEqual([
      { value: 'bimo0000048798' },
    ])
    entry.edition.claims['wdt:P1476'].should.deepEqual([
      { value: 'O templo do sol', references: [ reference ] },
    ])
    entry.edition.claims['wdt:P407'].should.deepEqual([
      { value: 'wd:Q9307', references: [ reference ] },
    ])
    entry.edition.claims['wdt:P1104'].should.deepEqual([
      { value: 62, references: [ reference ] },
    ])
    entry.edition.claims['wdt:P577'].should.deepEqual([
      { value: '1988', references: [ reference ] },
    ])
  })

  it('should not get an entry from an unknown ISBN', async () => {
    const entry = await getBneEntryFromIsbn('978-3-9818987-4-3')
    should(entry).not.be.ok()
  })

  it('should resolve same as matches', async () => {
    const entry = await getBneEntryFromIsbn('84-218-1182-7')
    const reference = {
      'wdt:P950': [ 'XX887342' ],
      'wdt:P813': [ simpleDay() ],
    }
    entry.authors[0].uri.should.equal('wd:Q309945')
    entry.authors[0].claims['wdt:P950'].should.deepEqual([
      { value: 'XX887342' },
    ])
    entry.authors[0].claims['wdt:P269'].should.deepEqual([
      { value: '027069427', references: [ reference ] },
    ])
    entry.authors[0].claims['wdt:P213'].should.deepEqual([
      { value: '0000000121441313', references: [ reference ] },
    ])
    entry.authors[0].claims['wdt:P214'].should.deepEqual([
      { value: '95155932', references: [ reference ] },
    ])
    entry.authors[0].claims['wdt:P227'].should.deepEqual([
      { value: '109062353', references: [ reference ] },
    ])
    entry.authors[0].claims['wdt:P244'].should.deepEqual([
      { value: 'n82047405', references: [ reference ] },
    ])
    entry.authors[0].claims['wdt:P906'].should.deepEqual([
      { value: '83651', references: [ reference ] },
    ])
  })
})
