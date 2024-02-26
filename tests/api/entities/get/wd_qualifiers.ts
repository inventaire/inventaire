import should from 'should'
import { getWdEntity } from '#data/wikidata/get_entity'
import { getByUris } from '#tests/api/utils/entities'

describe('entities:get:by-uris:wd-qualifiers-adapter', () => {
  it('should flatten wikidata qualifier properties used as mainsnak in inventaire', async () => {
    const id = 'Q3024217'
    const uri = `wd:${id}`

    // The test relies on the state of an entity on Wikidata that needs
    // to be checked to assert that we are actually testing the desired behavior
    const rawEntity = await getWdEntity(id)
    if (rawEntity.claims.P1545) throw new Error(`${id} should not have a P1545 claim`)

    const { entities } = await getByUris(uri, null, true)
    const entity = entities[uri]
    entity.claims['wdt:P179'].should.deepEqual([ 'wd:Q1130014' ])
    // This claim is expected to be a qualifier from the one above
    entity.claims['wdt:P1545'].should.deepEqual([ '111' ])
  })

  it('should not flatten wikidata qualifier properties when there are too many', async () => {
    const id = 'Q54802792'
    const uri = `wd:${id}`

    // The test relies on the state of an entity on Wikidata that needs
    // to be checked to assert that we are actually testing the desired behavior
    const rawEntity = await getWdEntity(id)
    if (rawEntity.claims.P179.length !== 2) throw new Error(`${id} should have 2 P179 claims`)
    if (rawEntity.claims.P1545) throw new Error(`${id} should not have a P1545 claim`)

    const { entities } = await getByUris(uri, null, true)
    const entity = entities[uri]
    should(entity.claims['wdt:P1545']).not.be.ok()
  })
})
