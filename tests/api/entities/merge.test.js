const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { authReq, dataadminReq, shouldNotBeCalled } = require('../utils/utils')
const randomString = require('lib/utils/random_string')
const { getByUris, merge, getHistory, addClaim } = require('../utils/entities')
const { getByIds: getItemsByIds } = require('../utils/items')
const { createWork, createHuman, createEdition, createEditionWithIsbn, createItemFromEntityUri, createWorkWithAuthor, someFakeUri } = require('../fixtures/entities')

describe('entities:merge', () => {
  it('should require dataadmin rights', async () => {
    await authReq('put', '/api/entities?action=merge')
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(403)
    })
  })

  it('should reject without from uri', async () => {
    await dataadminReq('put', '/api/entities?action=merge')
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: from')
      err.statusCode.should.equal(400)
    })
  })

  it('should reject without to uri', async () => {
    await dataadminReq('put', '/api/entities?action=merge', { from: someFakeUri })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: to')
      err.statusCode.should.equal(400)
    })
  })

  it('should reject invalid uris', async () => {
    await dataadminReq('put', '/api/entities?action=merge', { from: 'fromUri', to: 'toUri' })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid from:')
      err.statusCode.should.equal(400)
    })
  })

  it('should reject invalid from prefix', async () => {
    await dataadminReq('put', '/api/entities?action=merge', { from: 'wd:Q42', to: someFakeUri })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith("invalid 'from' uri domain: wd. Accepted domains: inv,isbn")
      err.statusCode.should.equal(400)
    })
  })

  it('should return uris not found', async () => {
    await dataadminReq('put', '/api/entities?action=merge', { from: someFakeUri, to: 'wd:Q42' })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal("'from' entity not found")
      err.statusCode.should.equal(400)
    })
  })

  it('should merge two entities with an inv URI', async () => {
    const [ workA, workB ] = await Promise.all([
      createWork(),
      createWork()
    ])
    await merge(workA.uri, workB.uri)
    const { entities, redirects } = await getByUris(workA.uri)
    redirects[workA.uri].should.equal(workB.uri)
    entities[workB.uri].should.be.ok()
  })

  it('should merge entities with inv and isbn URIs', async () => {
    const [ editionA, editionB ] = await Promise.all([
      createEdition(),
      createEditionWithIsbn()
    ])
    const item = await createItemFromEntityUri({ uri: editionA.uri })
    item.entity.should.equal(editionA.uri)
    await merge(editionA.uri, editionB.uri)
    const [ { entities, redirects }, { items } ] = await Promise.all([
      getByUris(editionA.uri),
      getItemsByIds(item._id)
    ])
    redirects[editionA.uri].should.equal(editionB.uri)
    entities[editionB.uri].should.be.ok()
    items[0].entity.should.equal(editionB.uri)
  })

  it('should merge an entity with an ISBN', async () => {
    const [ editionA, editionB ] = await Promise.all([
      createEditionWithIsbn(),
      createEdition()
    ])
    const item = await createItemFromEntityUri({ uri: editionB.uri })
    await merge(editionA.uri, editionB.uri)
    const [ { entities, redirects }, { items } ] = await Promise.all([
      getByUris(editionB.uri),
      getItemsByIds(item._id)
    ])
    const updatedEditionB = entities[redirects[editionB.uri]]
    updatedEditionB.claims['wdt:P212'].should.deepEqual(editionA.claims['wdt:P212'])
    const isbnUri = editionA.uri
    items[0].entity.should.equal(isbnUri)
  })

  it('should reject merge with different ISBNs', async () => {
    const [ editionA, editionB ] = await Promise.all([
      createEditionWithIsbn(),
      createEditionWithIsbn()
    ])
    await merge(editionA.uri, editionB.uri)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal("can't merge editions with different ISBNs")
      err.statusCode.should.equal(400)
    })
  })

  it('should transfer claims', async () => {
    const [ workA, workB ] = await Promise.all([
      createWork(),
      createWork()
    ])
    await addClaim(workA.uri, 'wdt:P50', 'wd:Q535')
    await merge(workA.uri, workB.uri)
    const { entities } = await getByUris(workB.uri)
    const authorsUris = entities[workB.uri].claims['wdt:P50']
    authorsUris.should.deepEqual([ 'wd:Q535' ])
  })

  it('should transfer labels', async () => {
    const label = randomString(6)
    const [ workA, workB ] = await Promise.all([
      createWork({ labels: { zh: label } }),
      createWork()
    ])
    await merge(workA.uri, workB.uri)
    const { entities } = await getByUris(workB.uri)
    entities[workB.uri].labels.zh.should.equal(label)
  })

  it('should keep track of the patch context', async () => {
    const [ workA, workB ] = await Promise.all([
      createWork(),
      createWork()
    ])
    await addClaim(workA.uri, 'wdt:P50', 'wd:Q535')
    await merge(workA.uri, workB.uri)
    const patches = await getHistory(workB._id)
    patches[1].context.mergeFrom.should.equal(workA.uri)
  })

  it('should redirect claims', async () => {
    const [ humanA, humanB, work ] = await Promise.all([
      createHuman(),
      createHuman(),
      createWork()
    ])
    await addClaim(work.uri, 'wdt:P50', humanA.uri)
    await merge(humanA.uri, humanB.uri)
    const { entities } = await getByUris(work.uri)
    const authorsUris = entities[work.uri].claims['wdt:P50']
    authorsUris.should.deepEqual([ humanB.uri ])
    const patches = await getHistory(work._id)
    // patch 0: create the work entity
    // patch 1: add a wdt:P50 claim pointing to to humanA
    // patch 2: redirect to humanB
    patches[2].context.redirectClaims.should.deepEqual({ fromUri: humanA.uri })
  })

  it('should reject a merge from a redirection', async () => {
    const [ workA, workB, workC ] = await Promise.all([
      createWork(),
      createWork(),
      createWork()
    ])
    await merge(workA.uri, workB.uri)
    await merge(workA.uri, workC.uri)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal("'from' entity is already a redirection")
    })
  })

  it('should reject a merge to a redirection', async () => {
    const [ workA, workB, workC ] = await Promise.all([
      createWork(),
      createWork(),
      createWork()
    ])
    await merge(workA.uri, workB.uri)
    await merge(workC.uri, workA.uri)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal("'to' entity is already a redirection")
    })
  })

  it('should reject a circular merge', async () => {
    const work = await createWork()
    await merge(work.uri, work.uri)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal("can't merge an entity into itself")
    })
  })

  it('should remove isolated human "placeholders" entities on works merge', async () => {
    const [ workA, workB ] = await Promise.all([
      createWorkWithAuthor(),
      createWorkWithAuthor()
    ])
    const humanAUri = workA.claims['wdt:P50'][0]
    await merge(workA.uri, workB.uri)
    const { entities } = await getByUris(humanAUri)
    const entity = entities[humanAUri]
    entity._meta_type.should.equal('removed:placeholder')
  })
})
