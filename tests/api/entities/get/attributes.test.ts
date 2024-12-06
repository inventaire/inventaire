import should from 'should'
import { objectValues } from '#lib/utils/base'
import { buildUrl } from '#lib/utils/url'
import {
  createEditionWithWorkAuthorAndSerie,
  createWorkWithAuthor,
  createWorkWithSpecificRoleAuthor,
} from '#tests/api/fixtures/entities'
import { getEntitiesAttributesByUris, getEntityAttributesByUri } from '#tests/api/utils/entities'
import { publicReq } from '#tests/api/utils/utils'
import type { ExpandedSerializedEntity } from '#types/entity'

let workWithAuthorPromise

describe('entities:get:by-uris:attributes', () => {
  before(() => {
    workWithAuthorPromise = createWorkWithAuthor()
  })
  it("should return only the requested 'attributes'", async () => {
    const work = await workWithAuthorPromise
    const { uri: invWorkUri } = work
    const invAuthorUri = work.claims['wdt:P50'][0]
    const wdUri = 'wd:Q2300248'
    const entities = await getEntitiesAttributesByUris({
      uris: [ invWorkUri, invAuthorUri, wdUri ],
      attributes: [ 'labels', 'descriptions' ],
    })
    entities[invWorkUri].uri.should.be.ok()
    entities[invAuthorUri].uri.should.be.ok()
    entities[wdUri].uri.should.be.ok()
    entities[invWorkUri].labels.should.be.ok()
    entities[invAuthorUri].labels.should.be.ok()
    entities[wdUri].labels.should.be.ok()
    entities[wdUri].descriptions.should.be.ok()
    should(entities[invWorkUri].claims).not.be.ok()
    should(entities[invAuthorUri].claims).not.be.ok()
    should(entities[wdUri].aliases).not.be.ok()
    should(entities[wdUri].claims).not.be.ok()
    should(entities[wdUri].sitelinks).not.be.ok()
  })

  it('should get relatives attributes', async () => {
    const { uri: editionUri } = await createEditionWithWorkAuthorAndSerie()
    const entitiesByUris = await getEntitiesAttributesByUris({
      uris: editionUri,
      attributes: [ 'info', 'labels' ],
      relatives: [ 'wdt:P50', 'wdt:P179', 'wdt:P629' ],
    })
    const entities = Object.values(entitiesByUris)
    const edition = entities.find(entity => entity.type === 'edition')
    const work = entities.find(entity => entity.type === 'work')
    const serie = entities.find(entity => entity.type === 'serie')
    const human = entities.find(entity => entity.type === 'human')
    edition.labels.fromclaims.should.be.ok()
    work.labels.en.should.be.ok()
    serie.labels.en.should.be.ok()
    human.labels.en.should.be.ok()
  })

  it('should return entities dry popularity', async () => {
    const { uri: editionUri } = await createEditionWithWorkAuthorAndSerie()
    const entities = await getEntitiesAttributesByUris({
      uris: [ editionUri ],
      attributes: [ 'info', 'labels', 'popularity' ],
      relatives: [ 'wdt:P50', 'wdt:P179', 'wdt:P629' ],
    })
    Object.values(entities).forEach(entity => {
      entity.popularity.should.equal(0)
    })
  })

  it('should return entities fresh popularity', async () => {
    const { uri: editionUri } = await createEditionWithWorkAuthorAndSerie()
    const entities = await getEntitiesAttributesByUris({
      uris: [ editionUri ],
      attributes: [ 'info', 'labels', 'popularity' ],
      relatives: [ 'wdt:P50', 'wdt:P179', 'wdt:P629' ],
      refresh: true,
    })
    Object.values(entities).forEach(entity => {
      if (entity.type === 'edition') entity.popularity.should.equal(0)
      else entity.popularity.should.be.above(0)
    })
  })

  it('should support alternative author roles', async () => {
    const roleProperty = 'wdt:P10837'
    const { work, human } = await createWorkWithSpecificRoleAuthor({ roleProperty })
    const url = buildUrl('/api/entities', {
      action: 'by-uris',
      uris: work.uri,
      attributes: 'info|labels',
      relatives: roleProperty,
    })
    const { entities } = await publicReq('get', url)
    entities[work.uri].should.be.ok()
    entities[human.uri].should.be.ok()
  })

  it('should get expanded claims when requesting references', async () => {
    const { uri: editionUri } = await createEditionWithWorkAuthorAndSerie()
    const entity = await getEntityAttributesByUri({
      uri: editionUri,
      attributes: [ 'labels', 'claims', 'references' ],
    }) as ExpandedSerializedEntity
    entity.labels.fromclaims.should.be.a.String()
    const allPropertyClaims = objectValues(entity.claims)
    allPropertyClaims.length.should.be.above(3)
    for (const propertyClaims of objectValues(entity.claims)) {
      for (const claim of propertyClaims) {
        claim.should.be.an.Object()
        claim.value.should.be.ok()
      }
    }
  })
})
