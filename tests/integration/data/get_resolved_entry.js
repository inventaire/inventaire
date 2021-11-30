const _ = require('builders/utils')
require('should')
const { getResolvedEntity, getResolvedEntry } = require('data/dataseed/get_resolved_entry')
const getEntityByUri = require('controllers/entities/lib/get_entity_by_uri')

describe('get resolved entity', () => {
  it('should get an edition entity when only one authority returns a seed', async () => {
    // Expect only BNF to return a seed
    const edition = await getResolvedEntity('978-2-207-11674-6')
    edition.claims['wdt:P629'].should.deepEqual([ 'wd:Q3210286' ])
    edition.claims['wdt:P268'].should.deepEqual([ '437169336' ])
  })

  it('should get an edition entity when multiple authorities return a seed', async () => {
    // Expect both BNE and BNF to return seeds
    const edition = await getResolvedEntity('84-00-06759-2')
    // with the BNF seed to be considered more resolved, and thus be selected
    edition.claims['wdt:P268'].should.deepEqual([ '43031012r' ])
    const workUri = edition.claims['wdt:P629'][0]
    const work = await getEntityByUri({ uri: workUri })
    const authorUri = work.claims['wdt:P50'][0]
    authorUri.should.equal('wd:Q470568')
    // it should aggregate claims results
    // BNE property which does not exist on BNF
    edition.claims['wdt:P577'][0].should.equal('1988')
    // BNF and BNE property, with a BNF value as BNF has a higher score
    edition.claims['wdt:P407'][0].should.equal('wd:Q397')
  })

  it('should not get an entry from an unknown ISBN', async () => {
    const edition = await getResolvedEntity('978-3-9818987-4-3')
    edition.notFound.should.be.true()
  })

  it('should get an edition from an ISBN found on Wikidata', async () => {
    // Expect the following triple to exist: wd:Q81689 wdt:P957 "84-95618-60-5"
    const edition = await getResolvedEntity('84-95618-60-5')
    edition.claims['wdt:P629'].should.deepEqual([ 'wd:Q81689' ])
  })

  it('should create local entity when resolved entity has an unknown type', async () => {
    const edition = await getResolvedEntity('978-88-7799-292-5')
    // BNF finds that the work is wd:Q238476, which is not identified
    // as a work by server/controllers/entities/lib/get_entity_type.js
    // wd:Q238476 should thus be discarded and an new inv entity should be set as wdt:P629
    edition.claims['wdt:P629'][0].should.startWith('inv:')
  })
})

describe('get resolved entry', () => {
  it('should get resolved entry with authors and works uris', async () => {
    const entry = basicEntry('978-2-207-11674-6')
    const { edition, works, authors } = await getResolvedEntry(entry)
    edition.claims['wdt:P629'].should.deepEqual([ 'wd:Q3210286' ])
    edition.claims['wdt:P268'].should.deepEqual([ '437169336' ])
    works[0].uri.should.equal('wd:Q3210286')
    authors[0].uri.should.equal('wd:Q123080')
  })

  it('should not update authorities and dataseed data', async () => {
    const isbn = '9782207116746'
    const entry = basicEntry(isbn)
    _.extend(entry.edition, { claims: { 'wdt:P1476': [ 'yolo' ] } })
    const res = await getResolvedEntry(entry)
    const { edition } = res
    edition.isbn.should.equal(isbn)
    edition.uri.should.endWith(isbn)
    const titlesClaim = edition.claims['wdt:P1476']
    titlesClaim.length.should.equal(1)
    titlesClaim[0].should.not.equal('yolo')
  })
})

const basicEntry = isbn => ({
  edition: { isbn },
  works: [ { } ],
  authors: [ { } ]
})
