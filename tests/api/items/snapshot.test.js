const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const { wait } = __.require('lib', 'promises')
const { authReq } = require('../utils/utils')
const { getById: getItem } = require('../utils/items')
const { getByUris, merge, revertMerge, updateLabel, updateClaim } = require('../utils/entities')
const { createWork, createHuman, addAuthor, addSerie, createEdition, createEditionFromWorks, createWorkWithAuthor, humanName, someImageHash, createEditionWithWorkAndAuthor } = require('../fixtures/entities')

describe('items:snapshot', () => {
  it("should snapshot the item's work series names", async () => {
    const workEntity = await createWork()
    const serieEntity = await addSerie(workEntity)
    await wait(100)
    const item = await authReq('post', '/api/items', { entity: workEntity.uri, lang: 'en' })
    const title = _.values(serieEntity.labels)[0]
    item.snapshot['entity:series'].should.equal(title)
  })

  it("should snapshot the item's work series ordinal", async () => {
    const workEntity = await createWork()
    const [ item ] = await Promise.all([
      authReq('post', '/api/items', { entity: workEntity.uri, lang: 'en' }),
      addSerie(workEntity)
    ])
    await wait(100)
    await updateClaim(workEntity.uri, 'wdt:P1545', null, '5')
    await wait(100)
    const updatedItem = await getItem(item)
    updatedItem.snapshot['entity:ordinal'].should.equal('5')
    updateClaim(workEntity.uri, 'wdt:P1545', '5', '6')
    await wait(100)
    const reupdatedItem = await getItem(item)
    reupdatedItem.snapshot['entity:ordinal'].should.equal('6')
  })

  it('should snapshot data from all the works of a composite edition', async () => {
    const [ workA, workB ] = await Promise.all([
      createWork(),
      createWork()
    ])
    const authors = await Promise.all([
      addAuthor(workA),
      addAuthor(workB)
    ])
    const series = await Promise.all([
      addSerie(workA),
      addSerie(workB)
    ])
    const edition = await createEditionFromWorks(workA, workB)
    const item = await authReq('post', '/api/items', { entity: edition.uri })
    const authorsNames = authors.map(author => author.labels.en).join(', ')
    const seriesNames = series.map(serie => serie.labels.en).join(', ')
    item.snapshot['entity:authors'].should.equal(authorsNames)
    item.snapshot['entity:series'].should.equal(seriesNames)
  })

  it('should snapshot the image of an edition', async () => {
    const edition = await createEdition()
    edition.image.url.should.equal(`/img/entities/${someImageHash}`)
    const item = await authReq('post', '/api/items', { entity: edition.uri })
    item.snapshot['entity:image'].should.equal(edition.image.url)
  })

  it('should snapshot the subtitle of an edition', async () => {
    const edition = await createEdition()
    const subtitle = edition.claims['wdt:P1680'][0]
    subtitle.should.a.String()
    const item = await authReq('post', '/api/items', { entity: edition.uri })
    item.snapshot['entity:subtitle'].should.equal(subtitle)
  })

  it('should snapshot the image of an edition after a work-related refresh', async () => {
    const edition = await createEdition()
    const item = await authReq('post', '/api/items', { entity: edition.uri })
    item.snapshot['entity:image'].should.equal(edition.image.url)
    const workUri = edition.claims['wdt:P629'][0]
    await updateClaim(workUri, 'wdt:P50', null, 'wd:Q535')
    const updatedItem = await getItem(item)
    updatedItem.snapshot['entity:image'].should.equal(edition.image.url)
  })

  describe('update', () => {
    it('should be updated when its local edition entity title changes', async () => {
      const work = await createWork()
      const { _id: entityId, uri } = await createEditionFromWorks(work)
      const item = await authReq('post', '/api/items', { entity: uri })
      const currentTitle = item.snapshot['entity:title']
      const updatedTitle = `${currentTitle.split('$$')[0]}$$${new Date().toISOString()}`
      await updateClaim(entityId, 'wdt:P1476', currentTitle, updatedTitle)
      await wait(100)
      const updatedItem = await getItem(item)
      updatedItem.snapshot['entity:title'].should.equal(updatedTitle)
    })

    it('should be updated when its local work entity title changes', async () => {
      const { _id: entityId, uri } = await createWork()
      const item = await authReq('post', '/api/items', { entity: uri, lang: 'en' })
      const currentTitle = item.snapshot['entity:title']
      const updatedTitle = `${currentTitle} ${new Date().toISOString()}`
      await updateLabel(entityId, 'en', updatedTitle)
      await wait(100)
      const updatedItem = await getItem(item)
      updatedItem.snapshot['entity:title'].should.equal(updatedTitle)
    })

    it('should be updated when its local serie entity title changes', async () => {
      const workEntity = await createWork()
      const item = await authReq('post', '/api/items', { entity: workEntity.uri, lang: 'en' })
      await wait(200)
      const serieEntity = await addSerie(workEntity)
      await wait(200)
      const title = _.values(serieEntity.labels)[0]
      const updatedItem = await getItem(item)
      updatedItem.snapshot['entity:series'].should.equal(title)
      const updatedTitle = `${title}-updated`
      await updateLabel(serieEntity._id, 'en', updatedTitle)
      await wait(200)
      const reupdatedItem = await getItem(item)
      reupdatedItem.snapshot['entity:series'].should.equal(updatedTitle)
    })

    it('should be updated when its local author entity title changes (edition entity)', async () => {
      const edition = await createEditionWithWorkAndAuthor()
      const workUri = edition.claims['wdt:P629'][0]
      const { entities } = await getByUris(workUri)
      const workEntity = _.values(entities)[0]
      const authorUri = workEntity.claims['wdt:P50'][0]
      const item = await authReq('post', '/api/items', { entity: edition.uri })
      await wait(200)
      const updateAuthorName = humanName()
      await updateLabel(authorUri, 'en', updateAuthorName)
      await wait(200)
      const updatedItem = await getItem(item)
      updatedItem.snapshot['entity:authors'].should.equal(updateAuthorName)
    })

    it('should be updated when its local author entity title changes (work entity)', async () => {
      const workEntity = await createWorkWithAuthor()
      const item = await authReq('post', '/api/items', { entity: workEntity.uri, lang: 'en' })
      const updateAuthorName = humanName()
      const uri = workEntity.claims['wdt:P50'][0]
      await updateLabel(uri, 'en', updateAuthorName)
      await wait(100)
      const updatedItem = await getItem(item)
      updatedItem.snapshot['entity:authors'].should.equal(updateAuthorName)
    })

    it('should be updated when its local work entity is merged (work entity)', async () => {
      const [ workEntityA, workEntityB ] = await Promise.all([
        createWork(),
        createWork()
      ])
      const item = await authReq('post', '/api/items', { entity: workEntityA.uri, lang: 'en' })
      await merge(workEntityA.uri, workEntityB.uri)
      const updatedItem = await getItem(item)
      const updatedTitle = workEntityB.labels.en
      updatedItem.snapshot['entity:title'].should.equal(updatedTitle)
    })

    it('should be updated when its local work entity is merged (edition entity)', async () => {
      const [ workEntityA, workEntityB ] = await Promise.all([
        createWork(),
        createWork()
      ])
      const editionEntity = await createEditionFromWorks(workEntityA)
      const [ item, addedAuthor ] = await Promise.all([
        authReq('post', '/api/items', { entity: editionEntity.uri }),
        addAuthor(workEntityB)
      ])
      await wait(200)
      await merge(workEntityA.uri, workEntityB.uri)
      await wait(200)
      const updatedItem = await getItem(item)
      const authorName = _.values(addedAuthor.labels)[0]
      updatedItem.snapshot['entity:authors'].should.equal(authorName)
    })

    it('should be updated when its local author entity is merged', async () => {
      const [ authorEntityA, authorEntityB ] = await Promise.all([
        createHuman(),
        createHuman()
      ])
      const workEntity = await createWorkWithAuthor(authorEntityA)
      const item = await authReq('post', '/api/items', { entity: workEntity.uri, lang: 'en' })
      await wait(200)
      await merge(authorEntityA.uri, authorEntityB.uri)
      await wait(200)
      const updatedItem = await getItem(item)
      const updatedAuthors = authorEntityB.labels.en
      updatedItem.snapshot['entity:authors'].should.equal(updatedAuthors)
    })

    it('should be updated when its local author entity is merged and reverted', async () => {
      const [ authorEntityA, authorEntityB ] = await Promise.all([
        createHuman(),
        createHuman()
      ])
      const workEntity = await createWorkWithAuthor(authorEntityA)
      const item = await authReq('post', '/api/items', { entity: workEntity.uri, lang: 'en' })
      await wait(200)
      await merge(authorEntityA.uri, authorEntityB.uri)
      await wait(200)
      const updatedItem = await getItem(item)
      const updatedAuthors = authorEntityB.labels.en
      updatedItem.snapshot['entity:authors'].should.equal(updatedAuthors)
      await revertMerge(authorEntityA.uri)
      await wait(200)
      const reupdatedItem = await getItem(updatedItem)
      const oldAuthors = authorEntityA.labels.en
      reupdatedItem.snapshot['entity:authors'].should.equal(oldAuthors)
    })

    it('should be updated when its entity changes', async () => {
      const workEntityA = await createWork()
      const [ editionEntity, item ] = await Promise.all([
        createEditionFromWorks(workEntityA),
        authReq('post', '/api/items', { entity: workEntityA.uri, lang: 'en' })
      ])
      await wait(100)
      item.entity = editionEntity.uri
      const updatedItem = await authReq('put', '/api/items', item)
      const editionTitle = editionEntity.claims['wdt:P1476'][0]
      updatedItem.snapshot['entity:title'].should.equal(editionTitle)
    })

    it('should be updated when its remote work entity changes', async () => {
      // Simulating a change on the Wikidata work by merging an inv work into it
      const workEntity = await createWork()
      const editionEntity = await createEditionFromWorks(workEntity)
      const item = await authReq('post', '/api/items', { entity: editionEntity.uri })
      await merge(workEntity.uri, 'wd:Q3209796')
      await wait(100)
      const updatedItem = await getItem(item)
      updatedItem.snapshot['entity:authors'].should.equal('Alain Damasio')
    })

    it('should be updated when its remote author entity changes', async () => {
      // Simulating a change on the Wikidata author by merging an inv author into it
      const work = await createWork()
      const [ edition, author ] = await Promise.all([
        createEdition({ work }),
        addAuthor(work)
      ])
      const item = await authReq('post', '/api/items', { entity: edition.uri })
      await wait(200)
      await merge(author.uri, 'wd:Q2829704')
      await wait(200)
      const updatedItem = await getItem(item)
      updatedItem.snapshot['entity:authors'].should.equal('Alain Damasio')
    })
  })
})
