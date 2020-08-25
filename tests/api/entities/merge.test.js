const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { authReq, dataadminReq, undesiredRes, shouldNotBeCalled } = require('../utils/utils')
const randomString = __.require('lib', './utils/random_string')
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

  it('should merge two entities with an inv URI', done => {
    Promise.all([
      createWork(),
      createWork()
    ])
    .then(([ workA, workB ]) => {
      return merge(workA.uri, workB.uri)
      .then(() => getByUris(workA.uri))
      .then(res => {
        res.redirects[workA.uri].should.equal(workB.uri)
        res.entities[workB.uri].should.be.ok()
        done()
      })
    })
    .catch(done)
  })

  it('should merge entities with inv and isbn URIs', async () => {
    const [ editionA, editionB ] = await Promise.all([
      createEdition(),
      createEditionWithIsbn()
    ])
    const item = await createItemFromEntityUri(editionA.uri)
    item.entity.should.equal(editionA.uri)
    await merge(editionA.uri, editionB.uri)
    const [ entitiesRes, itemsRes ] = await Promise.all([
      getByUris(editionA.uri),
      getItemsByIds(item._id)
    ])
    entitiesRes.redirects[editionA.uri].should.equal(editionB.uri)
    entitiesRes.entities[editionB.uri].should.be.ok()
    itemsRes.items[0].entity.should.equal(editionB.uri)
  })

  it('should merge an entity with an ISBN', async () => {
    const [ editionA, editionB ] = await Promise.all([
      createEditionWithIsbn(),
      createEdition()
    ])
    const item = await createItemFromEntityUri(editionB.uri)
    await merge(editionA.uri, editionB.uri)
    const [ entitiesRes, itemsRes ] = await Promise.all([
      getByUris(editionB.uri),
      getItemsByIds(item._id)
    ])
    const { entities, redirects } = entitiesRes
    const updatedEditionB = entities[redirects[editionB.uri]]
    updatedEditionB.claims['wdt:P212']
    .should.deepEqual(editionA.claims['wdt:P212'])
    const isbnUri = editionA.uri
    itemsRes.items[0].entity.should.equal(isbnUri)
  })

  it('should reject merge with different ISBNs', async () => {
    const [ editionA, editionB ] = await Promise.all([
      createEditionWithIsbn(),
      createEditionWithIsbn()
    ])
    try {
      await merge(editionA.uri, editionB.uri).then(shouldNotBeCalled)
    } catch (err) {
      err.body.status_verbose.should.equal("can't merge editions with different ISBNs")
      err.statusCode.should.equal(400)
    }
  })

  it('should transfer claims', done => {
    Promise.all([
      createWork(),
      createWork()
    ])
    .then(([ workA, workB ]) => {
      return addClaim(workA.uri, 'wdt:P50', 'wd:Q535')
      .then(() => merge(workA.uri, workB.uri))
      .then(() => getByUris(workB.uri))
      .then(res => {
        const authorsUris = res.entities[workB.uri].claims['wdt:P50']
        authorsUris.should.deepEqual([ 'wd:Q535' ])
        done()
      })
    })
    .catch(done)
  })

  it('should transfer labels', done => {
    const label = randomString(6)
    Promise.all([
      createWork({ labels: { zh: label } }),
      createWork()
    ])
    .then(([ workA, workB ]) => {
      return merge(workA.uri, workB.uri)
      .then(() => getByUris(workB.uri))
      .then(res => {
        res.entities[workB.uri].labels.zh.should.equal(label)
        done()
      })
    })
    .catch(done)
  })

  it('should keep track of the patch context', done => {
    Promise.all([
      createWork(),
      createWork()
    ])
    .then(([ workA, workB ]) => {
      return addClaim(workA.uri, 'wdt:P50', 'wd:Q535')
      .then(() => merge(workA.uri, workB.uri))
      .then(() => getHistory(workB._id))
      .then(patches => {
        patches[1].context.mergeFrom.should.equal(workA.uri)
        done()
      })
    })
    .catch(done)
  })

  it('should redirect claims', done => {
    Promise.all([
      createHuman(),
      createHuman(),
      createWork()
    ])
    .then(([ humanA, humanB, work ]) => {
      return addClaim(work.uri, 'wdt:P50', humanA.uri)
      .then(() => merge(humanA.uri, humanB.uri))
      .then(() => getByUris(work.uri))
      .then(res => {
        const authorsUris = res.entities[work.uri].claims['wdt:P50']
        authorsUris.should.deepEqual([ humanB.uri ])
      })
      .then(() => getHistory(work._id))
      .then(patches => {
        // patch 0: create the work entity
        // patch 1: add a wdt:P50 claim pointing to to humanA
        // patch 2: redirect to humanB
        patches[2].context.redirectClaims
        .should.deepEqual({ fromUri: humanA.uri })
        done()
      })
    })
    .catch(done)
  })

  it('should reject a merge from a redirection', done => {
    Promise.all([
      createWork(),
      createWork(),
      createWork()
    ])
    .then(([ workA, workB, workC ]) => {
      return merge(workA.uri, workB.uri)
      .then(() => merge(workA.uri, workC.uri))
      .then(undesiredRes(done))
      .catch(err => {
        err.statusCode.should.equal(400)
        err.body.status_verbose.should.equal("'from' entity is already a redirection")
        done()
      })
    })
    .catch(done)
  })

  it('should reject a merge to a redirection', done => {
    Promise.all([
      createWork(),
      createWork(),
      createWork()
    ])
    .then(([ workA, workB, workC ]) => {
      return merge(workA.uri, workB.uri)
      .then(() => merge(workC.uri, workA.uri))
      .then(undesiredRes(done))
      .catch(err => {
        err.statusCode.should.equal(400)
        err.body.status_verbose.should.equal("'to' entity is already a redirection")
        done()
      })
    })
    .catch(done)
  })

  it('should reject a circular merge', done => {
    createWork()
    .then(work => {
      return merge(work.uri, work.uri)
      .then(undesiredRes(done))
      .catch(err => {
        err.statusCode.should.equal(400)
        err.body.status_verbose
        .should.equal("can't merge an entity into itself")
        done()
      })
    })
    .catch(done)
  })

  it('should remove isolated human "placeholders" entities on works merge', done => {
    Promise.all([
      createWorkWithAuthor(),
      createWorkWithAuthor()
    ])
    .then(([ workA, workB ]) => {
      const humanAUri = workA.claims['wdt:P50'][0]
      return merge(workA.uri, workB.uri)
      .then(() => getByUris(humanAUri))
      .then(res => {
        const entity = res.entities[humanAUri]
        entity._meta_type.should.equal('removed:placeholder')
        done()
      })
    })
    .catch(done)
  })
})
