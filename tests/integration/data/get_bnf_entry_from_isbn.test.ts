import should from 'should'
import getBnfEntryFromIsbn, { cleanupBnfTitle } from '#data/bnf/get_bnf_entry_from_isbn'
import { simpleDay } from '#lib/utils/base'

describe('get_bnf_entry_from_isbn', () => {
  it('should get an entry from a known ISBN', async () => {
    const entry = await getBnfEntryFromIsbn('978-2-207-11674-6')
    entry.edition.claims['wdt:P268'][0].should.deepEqual({
      value: '437169336',
      references: [
        {
          'wdt:P854': [ 'https://catalogue.bnf.fr/ark:/12148/cb437169336' ],
          'wdt:P813': [ simpleDay() ],
        },
      ],
    })
    entry.works[0].claims['wdt:P268'][0].should.deepEqual({
      value: '12482666v',
      references: [
        {
          'wdt:P854': [ 'https://catalogue.bnf.fr/ark:/12148/cb12482666v' ],
          'wdt:P813': [ simpleDay() ],
        },
      ],
    })
    entry.authors[0].uri.should.equal('wd:Q123080')
    entry.authors[0].claims['wdt:P268'][0].should.deepEqual({
      value: '11895739q',
      references: [
        {
          'wdt:P854': [ 'https://catalogue.bnf.fr/ark:/12148/cb11895739q' ],
          'wdt:P813': [ simpleDay() ],
        },
      ],
    })
  })

  it('should not get an entry from an unknown ISBN', async () => {
    const entry = await getBnfEntryFromIsbn('978-3-9818987-4-3')
    should(entry).not.be.ok()
  })

  it('should include an image when one is available', async () => {
    const entry = await getBnfEntryFromIsbn('978-2-7560-2885-9')
    entry.edition.image.should.equal('https://catalogue.bnf.fr/couverture?appName=NE&idArk=ark:/12148/cb43483120v&couverture=1')
  })

  it('should not include an image when one is not available', async () => {
    const entry = await getBnfEntryFromIsbn('978-2-207-11674-6')
    should(entry.edition.image).not.be.ok()
  })

  it('should cleanup the title', async () => {
    const entry = await getBnfEntryFromIsbn('9782848051031')
    entry.edition.claims['wdt:P1476'][0].should.deepEqual({
      value: "La nuit du papillon d'or",
      references: [
        {
          'wdt:P854': [ 'https://catalogue.bnf.fr/ark:/12148/cb424992450' ],
          'wdt:P813': [ simpleDay() ],
        },
      ],
    })
  })

  it('should handle authors with only a family name', async () => {
    const entry = await getBnfEntryFromIsbn('9782723480451')
    const author = entry.authors.find(author => author.claims['wdt:P268']?.[0].value === '16545057v')
    author.labels.fr.should.equal('Juzhen')
  })

  it('should include resolvable edition contributors', async () => {
    const entry = await getBnfEntryFromIsbn('978-2-7555-0824-6')
    entry.edition.claims['wdt:P2679'][0].should.deepEqual({
      value: 'wd:Q17628988',
      references: [
        {
          'wdt:P854': [ 'https://catalogue.bnf.fr/ark:/12148/cb469671618' ],
          'wdt:P813': [ simpleDay() ],
        },
      ],
    })
  })
})

describe('cleanupBnfTitle', () => {
  it('should remove genre annotations', () => {
    cleanupBnfTitle("La nuit d'or : roman").should.equal("La nuit d'or")
    cleanupBnfTitle("La nuit d'or : récits").should.equal("La nuit d'or")
    cleanupBnfTitle("La nuit d'or : [nouvelles]").should.equal("La nuit d'or")
    cleanupBnfTitle("La nuit d'or : a biography").should.equal("La nuit d'or")
    cleanupBnfTitle("La nuit d'or : une biographie").should.equal("La nuit d'or")
    cleanupBnfTitle("La nuit d'or : roman policier").should.equal("La nuit d'or")
  })

  it('should remove number representations', () => {
    cleanupBnfTitle(':20000 :+vingt mille+ lieues sous les mers : bande dessinée').should.equal('vingt mille lieues sous les mers')
  })
})
