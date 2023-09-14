import { findOrIndexEntities } from '#tests/api/utils/entities'
import { search } from '#tests/api/utils/search'
import 'should'

const wikidataUris = [ 'wd:Q10134', 'wd:Q19852850', 'wd:Q33111' ]

describe('entities:languages:search', () => {
  before(async () => {
    // Ensure wikidata uris are indexed in the current format
    await findOrIndexEntities(wikidataUris)
  })

  it('should find a language by its label in the requested language', async () => {
    const results = await search({ types: 'languages', search: 'Korsische', lang: 'de' })
    results.should.be.an.Array()
    const language = results[0]
    language.uri.should.equal('wd:Q33111')
  })

  it('should find a language by its label in another language', async () => {
    const results = await search({ types: 'languages', search: 'Korsische', lang: 'fr' })
    results.should.be.an.Array()
    const language = results[0]
    language.uri.should.equal('wd:Q33111')
  })

  it('should find a language by its language code', async () => {
    // Testing with "Zherong Dialect" wd:Q19852850, as its language code does not match with its label
    const results = await search({ types: 'languages', search: 'zrog' })
    results.should.be.an.Array()
    const language = results[0]
    language.uri.should.equal('wd:Q19852850')
  })

  it('should ignore the code case', async () => {
    const results = await search({ types: 'languages', search: 'Zrog' })
    results.should.be.an.Array()
    const language = results[0]
    language.uri.should.equal('wd:Q19852850')
  })
})
