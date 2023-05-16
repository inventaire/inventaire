import should from 'should'
import getBnfEntryFromIsbn, { cleanupBnfTitle } from '#data/bnf/get_bnf_entry_from_isbn'

describe('get_bnf_entry_from_isbn', () => {
  it('should get an entry from a known ISBN', async () => {
    const entry = await getBnfEntryFromIsbn('978-2-207-11674-6')
    entry.edition.claims['wdt:P268'].should.equal('437169336')
    entry.works[0].claims['wdt:P268'].should.equal('12482666v')
    entry.authors[0].uri.should.equal('wd:Q123080')
    entry.authors[0].claims['wdt:P268'].should.equal('11895739q')
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
    entry.edition.claims['wdt:P1476'].should.equal("La nuit du papillon d'or")
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
