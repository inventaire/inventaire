const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = require('builders/utils')
const should = require('should')
const { wait } = require('lib/promises')
const { authReq, shouldNotBeCalled } = require('../utils/utils')
const { getByUris, deleteByUris } = require('../utils/entities')
const { getByIds: getItemsByIds } = require('../utils/items')
const { createHuman, createWork, createWorkWithAuthor, createEdition, createEditionWithIsbn } = require('../fixtures/entities')

describe('entities:delete', () => {
  it('should reject without uris', async () => {
    await authReq('post', '/api/entities?action=delete')
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: uris')
      err.statusCode.should.equal(400)
    })
  })

  it('should reject empty array as uris', async () => {
    await deleteByUris()
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal("uris array can't be empty")
      err.statusCode.should.equal(400)
    })
  })

  it('should reject non-inv URIs', async () => {
    await deleteByUris('wd:Q535')
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('invalid uri: wd:Q535')
      err.statusCode.should.equal(400)
    })
  })

  it('should turn entity into removed:placeholder', async () => {
    await createHuman()
    .then(entity => {
      const { uri } = entity
      return deleteByUris(uri)
      .then(() => getByUris(uri))
      .then(res => {
        entity = res.entities[uri]
        entity._meta_type.should.equal('removed:placeholder')
      })
    })
  })

  it('should remove several entities', async () => {
    const [ entityA, entityB ] = await Promise.all([
      createHuman(),
      createWork()
    ])
    const uris = [ entityA.uri, entityB.uri ]
    await deleteByUris(uris)
    let { entities } = await getByUris(uris)
    entities = _.values(entities)
    entities[0]._meta_type.should.equal('removed:placeholder')
    entities[0]._meta_type.should.equal('removed:placeholder')
  })

  it('should delete claims where the entity is the value', async () => {
    const work = await createWorkWithAuthor()
    const authorUri = work.claims['wdt:P50'][0]
    await deleteByUris(authorUri)
    const { entities } = await getByUris(work.uri)
    const updatedWork = entities[work.uri]
    should(updatedWork.claims['wdt:P50']).not.be.ok()
  })

  // Entities with more than one claim should be turned into redirections
  it('should reject when values are in more than one claim', async () => {
    const author = await createHuman()
    const [ workA, workB ] = await Promise.all([
      createWorkWithAuthor(author),
      createWorkWithAuthor(author)
    ])
    const property = 'wdt:P50'
    const authorUri = workA.claims[property][0]
    await deleteByUris(authorUri)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(403)
      err.body.status_verbose.should.equal('this entity is used has value in too many claims to be removed')
      const { uri, claims } = err.body.context
      uri.should.equal(author.uri)
      const claimA = claims.find(claim => claim.entity === workA.uri)
      const claimB = claims.find(claim => claim.entity === workB.uri)
      claimA.should.be.an.Object()
      claimA.property.should.equal(property)
      claimB.should.be.an.Object()
      claimB.property.should.equal(property)
    })
  })

  it('should remove edition entities without an ISBN', async () => {
    const edition = await createEdition()
    const invUri = `inv:${edition._id}`
    await deleteByUris(invUri)
  })

  it('should remove edition entities with an ISBN', async () => {
    const { invUri } = await createEditionWithIsbn()
    await deleteByUris(invUri)
  })

  it('should refuse to delete a work that is depend on by an edition', async () => {
    const edition = await createEdition()
    const property = 'wdt:P629'
    const workUri = edition.claims[property][0]
    await deleteByUris(workUri)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(403)
      err.body.status_verbose.should.equal('this entity is used in a critical claim')
      const { uri, claim } = err.body.context
      uri.should.equal(workUri)
      claim.should.deepEqual({ entity: edition.uri, property })
    })
  })

  it('should remove deleted entities from items snapshot', async () => {
    const author = await createHuman()
    const work = await createWorkWithAuthor(author)
    const item = await authReq('post', '/api/items', { entity: work.uri, lang: 'en' })
    item.snapshot['entity:title'].should.equal(work.labels.en)
    item.snapshot['entity:authors'].should.equal(author.labels.en)
    await deleteByUris(author.uri)
    await wait(100)
    const { items } = await getItemsByIds(item._id)
    const updatedItem = items[0]
    updatedItem.snapshot['entity:title'].should.equal(work.labels.en)
    should(updatedItem.snapshot['entity:authors']).not.be.ok()
  })

  it('should ignore entities that where already turned into removed:placeholder', async () => {
    const { uri } = await createHuman()
    await deleteByUris(uri)
    const { entities } = await getByUris(uri)
    should(entities[uri]._meta_type).equal('removed:placeholder')
    await deleteByUris(uri)
  })

  it('should not deleted entities that are the entity of an item', async () => {
    const work = await createWork()
    await authReq('post', '/api/items', { entity: work.uri, lang: 'en' })
    await deleteByUris(work.uri)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal("entities that are used by an item can't be removed")
      err.statusCode.should.equal(403)
    })
  })

  it('should not remove editions with an ISBN and an item', async () => {
    const { invUri, uri } = await createEditionWithIsbn()
    await authReq('post', '/api/items', { entity: uri, lang: 'en' })
    // Using the inv URI, as the isbn one would be rejected
    await deleteByUris(invUri)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal("entities that are used by an item can't be removed")
      err.statusCode.should.equal(403)
    })
  })
})
