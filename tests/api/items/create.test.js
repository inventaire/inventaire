const CONFIG = require('config')
require('should')
const { wait } = require('lib/promises')
const { authReq, getUser, getUserB, customAuthReq } = require('../utils/utils')
const { createEditionWithIsbn, createEdition, createWorkWithAuthor, createHuman, createEditionWithWorkAndAuthor } = require('../fixtures/entities')
const { createItem } = require('../fixtures/items')
const { createUser, getRefreshedUser } = require('../fixtures/users')
const { createShelf } = require('../fixtures/shelves')
const { getByUris: getEntitiesByUris } = require('../utils/entities')
const debounceDelay = CONFIG.itemsCountDebounceTime + 100
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('tests/api/utils/utils')
const { createGroup } = require('tests/api/fixtures/groups')

const editionUriPromise = createEdition().then(({ uri }) => uri)

describe('items:create', () => {
  it('should create an item', async () => {
    const [ user, editionUri ] = await Promise.all([
      getUser(),
      editionUriPromise
    ])
    const userId = user._id
    const item = await authReq('post', '/api/items', { entity: editionUri })
    item.entity.should.equal(editionUri)
    item.visibility.should.deepEqual([])
    item.transaction.should.equal('inventorying')
    item.owner.should.equal(userId)
  })

  it('should create items in bulk', async () => {
    const [ user, editionUri ] = await Promise.all([
      getUser(),
      editionUriPromise
    ])
    const userId = user._id
    const items = await authReq('post', '/api/items', [
      { entity: editionUri, visibility: [ 'friends', 'groups' ], transaction: 'giving' },
      { entity: editionUri, visibility: [ 'public' ], transaction: 'lending' }
    ])
    items[0].entity.should.equal(editionUri)
    items[0].visibility.should.deepEqual([ 'friends', 'groups' ])
    items[0].transaction.should.equal('giving')
    items[0].owner.should.equal(userId)
    items[1].entity.should.equal(editionUri)
    items[1].visibility.should.deepEqual([ 'public' ])
    items[1].transaction.should.equal('lending')
    items[1].owner.should.equal(userId)
  })

  describe('user:snapshot', () => {
    it('should increment the user items counter', async () => {
      const userPromise = createUser()
      const timestamp = Date.now()
      await createItem(userPromise, { visibility: [ 'public' ] })
      await wait(debounceDelay)
      const user = await getRefreshedUser(userPromise)
      user.snapshot.public['items:count'].should.equal(1)
      user.snapshot.public['items:last-add'].should.be.greaterThan(timestamp)
      user.snapshot.network['items:count'].should.equal(0)
      user.snapshot.private['items:count'].should.equal(0)
    })

    // Should not create edition conflicts on the user document
    it('should keep the snapshot data updated even when created in bulk', async () => {
      const user = await createUser()
      await Promise.all([
        createItem(user, { visibility: [ 'public' ] }),
        createItem(user, { visibility: [ 'friends', 'groups' ] }),
        createItem(user, { visibility: [] })
      ])
      await wait(debounceDelay)
      const refreshedUser = await getRefreshedUser(user)
      refreshedUser.snapshot.public['items:count'].should.equal(1)
      refreshedUser.snapshot.network['items:count'].should.equal(1)
      refreshedUser.snapshot.private['items:count'].should.equal(1)
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

    it('should deduce the author from a work entity', async () => {
      const author = await createHuman()
      const workEntity = await createWorkWithAuthor(author)
      const item = await authReq('post', '/api/items', { entity: workEntity.uri })
      item.snapshot.should.be.an.Object()
      item.snapshot['entity:authors'].should.equal(author.labels.en)
    })

    it('should deduce the author from an edition entity', async () => {
      const { uri: editionUri } = await createEditionWithWorkAndAuthor()
      await wait(100)
      const { entities } = await getEntitiesByUris(editionUri, 'wdt:P629|wdt:P50')
      const item = await authReq('post', '/api/items', { entity: editionUri })
      const edition = entities[editionUri]
      const work = entities[edition.claims['wdt:P629'][0]]
      const author = entities[work.claims['wdt:P50'][0]]
      const authorLabel = Object.values(author.labels)[0]
      item.snapshot.should.be.an.Object()
      item.snapshot['entity:authors'].should.equal(authorLabel)
    })

    it('should use the original language label for an item created from a work without specifying in which lang the title is', async () => {
      const item = await authReq('post', '/api/items', { entity: 'wd:Q3548806' })
      item.snapshot.should.be.an.Object()
      item.snapshot['entity:title'].should.equal('Die Hochzeit von Lyon')
      item.snapshot['entity:lang'].should.equal('de')
    })
  })

  it('should reject an item created with an unknown entity', async () => {
    await authReq('post', '/api/items', { entity: 'isbn:9782290711217' })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('some entities could not be found')
    })
  })

  it('should reject an item created with a non-allowlisted entity type', async () => {
    await authReq('post', '/api/items', { entity: 'wd:Q1' })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('invalid entity type')
    })
  })

  it('should reject an item created with an invalid URI', async () => {
    await authReq('post', '/api/items', { entity: 'isbn:9782800051922' })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('invalid uri id: 9782800051922 (uri: isbn:9782800051922)')
    })
  })

  describe('shelves', () => {
    it('should create an item with a shelf', async () => {
      const editionUri = await editionUriPromise
      const user = await getUser()
      const { shelf } = await createShelf(user)
      const item = await customAuthReq(user, 'post', '/api/items', {
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
      const { shelf } = await createShelf(getUserB())
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

  describe('visibility', () => {
    it('should reject an invalid visibility value', async () => {
      const group = await createGroup({ user: getUserB() })
      await createItem(getUser(), {
        visibility: [ `group:${group._id}` ]
      })
      .then(shouldNotBeCalled)
      .catch(err => {
        err.body.status_verbose.should.equal('owner is not in that group')
        err.statusCode.should.equal(400)
      })
    })
  })
})
