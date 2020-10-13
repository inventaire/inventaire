const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const { Wait, wait } = __.require('lib', 'promises')
const { authReq, getUser, getUserB } = require('../utils/utils')
const { createEditionWithIsbn, createEdition, createWorkWithAuthor, createHuman, createEditionWithWorkAndAuthor } = require('../fixtures/entities')
const { createItem } = require('../fixtures/items')
const { createUser, getRefreshedUser } = require('../fixtures/users')
const { createShelf } = require('../fixtures/shelves')
const { getByUris: getEntitiesByUris } = require('../utils/entities')
const debounceDelay = CONFIG.itemsCountDebounceTime + 100
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = __.require('apiTests', 'utils/utils')

const editionUriPromise = createEdition().then(({ uri }) => uri)

describe('items:create', () => {
  it('should create an item', done => {
    Promise.all([
      getUser(),
      editionUriPromise
    ])
    .then(([ user, editionUri ]) => {
      const userId = user._id
      return authReq('post', '/api/items', { entity: editionUri })
      .then(item => {
        item.entity.should.equal(editionUri)
        item.listing.should.equal('private')
        item.transaction.should.equal('inventorying')
        return item.owner.should.equal(userId)
      })
      .then(() => done())
    })
    .catch(done)
  })

  it('should create items in bulk', done => {
    Promise.all([
      getUser(),
      editionUriPromise
    ])
    .then(([ user, editionUri ]) => {
      const userId = user._id
      return authReq('post', '/api/items', [
        { entity: editionUri, listing: 'network', transaction: 'giving' },
        { entity: editionUri, listing: 'public', transaction: 'lending' }
      ])
      .then(items => {
        items[0].entity.should.equal(editionUri)
        items[0].listing.should.equal('network')
        items[0].transaction.should.equal('giving')
        items[0].owner.should.equal(userId)
        items[1].entity.should.equal(editionUri)
        items[1].listing.should.equal('public')
        items[1].transaction.should.equal('lending')
        return items[1].owner.should.equal(userId)
      })
      .then(() => done())
    })
    .catch(done)
  })

  describe('user:snapshot', () => {
    it('should increment the user items counter', done => {
      const userPromise = createUser()
      const timestamp = Date.now()
      createItem(userPromise, { listing: 'public' })
      .then(Wait(debounceDelay))
      .then(() => getRefreshedUser(userPromise))
      .then(user => {
        user.snapshot.public['items:count'].should.equal(1)
        user.snapshot.public['items:last-add'].should.be.greaterThan(timestamp)
        user.snapshot.network['items:count'].should.equal(0)
        user.snapshot.private['items:count'].should.equal(0)
        done()
      })
      .catch(done)
    })

    // Should not create edition conflicts on the user document
    it('should keep the snapshot data updated even when created in bulk', done => {
      const userPromise = createUser()
      Promise.all([
        createItem(userPromise, { listing: 'public' }),
        createItem(userPromise, { listing: 'network' }),
        createItem(userPromise, { listing: 'private' })
      ])
      .then(Wait(debounceDelay))
      .then(() => getRefreshedUser(userPromise))
      .then(user => {
        user.snapshot.public['items:count'].should.equal(1)
        user.snapshot.network['items:count'].should.equal(1)
        user.snapshot.private['items:count'].should.equal(1)
        done()
      })
      .catch(done)
    })
  })

  describe('item:snapshot', () => {
    it('should deduce the title from an edition entity', async () => {
      const edition = await createEditionWithIsbn()
      const title = edition.claims['wdt:P1476'][0]
      title.should.be.a.String()
      const item = await authReq('post', '/api/items', { entity: edition.uri })
      item.snapshot.should.be.an.Object()
      item.snapshot['entity:title'].should.equal(title)
    })

    it('should deduce the author from a work entity', done => {
      createHuman()
      .then(author => {
        return createWorkWithAuthor(author)
        .then(workEntity => {
          return authReq('post', '/api/items', { entity: workEntity.uri, lang: 'en' })
          .then(item => {
            item.snapshot.should.be.an.Object()
            item.snapshot['entity:authors'].should.equal(author.labels.en)
            done()
          })
        })
      })
      .catch(done)
    })

    it('should deduce the author from an edition entity', async () => {
      const { uri: editionUri } = await createEditionWithWorkAndAuthor()
      await wait(1000)
      const { entities } = await getEntitiesByUris(editionUri, 'wdt:P629|wdt:P50')
      const item = await authReq('post', '/api/items', { entity: editionUri })
      const edition = entities[editionUri]
      const work = entities[edition.claims['wdt:P629'][0]]
      const author = entities[work.claims['wdt:P50'][0]]
      const authorLabel = _.values(author.labels)[0]
      item.snapshot.should.be.an.Object()
      item.snapshot['entity:authors'].should.equal(authorLabel)
    })

    it('should use the original language label for an item created from a work without specifying in which lang the title is', done => {
      authReq('post', '/api/items', { entity: 'wd:Q3548806' })
      .then(item => {
        item.snapshot.should.be.an.Object()
        item.snapshot['entity:title'].should.equal('Die Hochzeit von Lyon')
        item.snapshot['entity:lang'].should.equal('de')
        done()
      })
      .catch(done)
    })
  })

  it('should reject an item created with an unknown entity', done => {
    authReq('post', '/api/items', { entity: 'isbn:9782290711217', lang: 'fr' })
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('entity not found')
      done()
    })
    .catch(done)
  })

  it('should reject an item created with a non-allowlisted entity type', done => {
    authReq('post', '/api/items', { entity: 'wd:Q1', lang: 'fr' })
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('invalid entity type')
      done()
    })
    .catch(done)
  })

  it('should reject an item created with an invalid URI', done => {
    authReq('post', '/api/items', { entity: 'isbn:9782800051922' })
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('invalid uri id: 9782800051922 (uri: isbn:9782800051922)')
      done()
    })
    .catch(done)
  })

  describe('shelves', () => {
    it('should create an item with a shelf', async () => {
      const editionUri = await editionUriPromise
      const shelf = await createShelf()
      const item = await authReq('post', '/api/items', {
        entity: editionUri,
        shelves: [ shelf._id ]
      })
      item.shelves.should.deepEqual([ shelf._id ])
    })

    it('should reject item with an invalid shelf', async () => {
      const editionUri = await editionUriPromise
      try {
        const item = await authReq('post', '/api/items', {
          entity: editionUri,
          shelves: [ 'not a shelf id' ]
        })
        shouldNotBeCalled(item)
      } catch (err) {
        rethrowShouldNotBeCalledErrors(err)
        err.statusCode.should.equal(400)
        err.body.error_name.should.equal('invalid_shelves')
      }
    })

    it('should reject item with a shelf from another owner', async () => {
      const shelf = await createShelf(getUserB())
      const editionUri = await editionUriPromise
      try {
        const item = await authReq('post', '/api/items', {
          entity: editionUri,
          shelves: [ shelf._id ]
        })
        shouldNotBeCalled(item)
      } catch (err) {
        rethrowShouldNotBeCalledErrors(err)
        err.statusCode.should.equal(400)
        err.body.status_verbose.should.equal('invalid owner')
      }
    })
  })
})
