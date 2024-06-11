import 'should'
import { getEntityByUri, getExpandedEntityByUri } from '#controllers/entities/lib/get_entity_by_uri'
import { enrichAndGetEditionEntityFromIsbn } from '#data/dataseed/enrich_and_get_edition_entity_from_isbn'
import { wait } from '#lib/promises'
import { simpleDay } from '#lib/utils/base'

describe('get resolved seed', () => {
  // Give the time to importCircularDependencies to run
  before(async () => await wait(1000))

  it('should get an edition entity when only one authority returns a seed', async () => {
    // Expect only BNF to return a seed. If that's not the case, you can find new candidates with
    // https://query.inventaire.io/#SELECT%20%2a%20%7B%0A%20%20%3Fitem%20wdt%3AP268%20%3FbnfId%20.%0A%20%20%3Fitem%20wdt%3AP629%20%3Fwork%20.%0A%20%20FILTER%20NOT%20EXISTS%20%7B%20%3Fwork%20wdt%3AP31%20%3Ftype%20%7D%20.%0A%20%20%3Fitem%20wdt%3AP212%20%3Fisbn%20.%0A%20%20%3Fitem%20wdt%3AP577%20%3Fdate%20.%0A%7D%0AORDER%20BY%20%3Fdate
    const { uri } = await enrichAndGetEditionEntityFromIsbn('978-2-245-00322-0')
    const edition = await getExpandedEntityByUri({ uri })
    edition.claims['wdt:P629'].should.deepEqual([ { value: 'wd:Q1217816' } ])
    edition.claims['wdt:P268'].should.deepEqual([ { value: '34577092d' } ])
    const reference = { 'wdt:P268': [ '34577092d' ], 'wdt:P813': [ simpleDay() ] }
    edition.claims['wdt:P577'].should.deepEqual([ { value: '1975', references: [ reference ] } ])
    edition.claims['wdt:P655'].should.deepEqual([ { value: 'wd:Q3587936', references: [ reference ] } ])
  })

  it('should get an edition entity when multiple authorities return a seed', async () => {
    // Expect both BNE and BNF to return seeds
    const edition = await enrichAndGetEditionEntityFromIsbn('84-00-06759-2')
    // with the BNF seed to be considered more resolved, and thus be selected
    edition.claims['wdt:P268'].should.deepEqual([ '43031012r' ])
    const workUri = edition.claims['wdt:P629'][0]
    const work = await getEntityByUri({ uri: workUri })
    const authorUri = work.claims['wdt:P50'][0]
    authorUri.should.equal('wd:Q470568')
    // it should aggregate claims results
    // BNE property which does not exist on BNF
    edition.claims['wdt:P577'][0].should.equal('1987')
    // BNF and BNE property, with a BNF value as BNF has a higher score
    edition.claims['wdt:P407'][0].should.equal('wd:Q397')
  })

  it('should not get an entry from an unknown ISBN', async () => {
    const edition = await enrichAndGetEditionEntityFromIsbn('978-3-9818987-4-3')
    edition.notFound.should.be.true()
  })

  it('should get an edition from an ISBN found on Wikidata', async () => {
    // Expect the following triple to exist: wd:Q154763 wdt:P212 "978-85-359-1404-7"
    const edition = await enrichAndGetEditionEntityFromIsbn('978-85-359-1404-7')
    edition.claims['wdt:P629'].should.deepEqual([ 'wd:Q154763' ])
  })

  it('should create local entity when resolved entity has an unknown type', async () => {
    const edition = await enrichAndGetEditionEntityFromIsbn('978-88-7799-292-5')
    // BNF finds that the work is wd:Q238476, which is not identified
    // as a work by server/controllers/entities/lib/get_entity_type.js
    // wd:Q238476 should thus be discarded and an new inv entity should be set as wdt:P629
    edition.claims['wdt:P629'][0].should.startWith('inv:')
  })
})
