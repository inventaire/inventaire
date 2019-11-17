// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const { Promise } = __.require('lib', 'promises')
const { authReq, getUser, undesiredErr, undesiredRes } = require('../utils/utils')
const { ensureEditionExists, createEdition, createWorkWithAuthor, createHuman } = require('../fixtures/entities')
const { createItem } = require('../fixtures/items')
const { createUser, getRefreshedUser } = require('../fixtures/users')
const { getByUris: getEntitiesByUris } = require('../utils/entities')
const debounceDelay = CONFIG.itemsCountDebounceTime + 100

const editionUriPromise = createEdition().get('uri')

describe('items:create', () => {
  it('should create an item', done => {
    Promise.all([
      getUser(),
      editionUriPromise
    ])
    .spread((user, editionUri) => {
      const userId = user._id
      return authReq('post', '/api/items', { entity: editionUri })
      .then(item => {
        item.entity.should.equal(editionUri)
        item.listing.should.equal('private')
        item.transaction.should.equal('inventorying')
        return item.owner.should.equal(userId)
      }).delay(10)
      .then(() => done())
    })
    .catch(undesiredErr(done))
  })

  it('should create items in bulk', done => {
    Promise.all([
      getUser(),
      editionUriPromise
    ])
    .spread((user, editionUri) => {
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
      }).delay(10)
      .then(() => done())
    })
    .catch(undesiredErr(done))
  })

  it('should increment the user items counter', done => {
    const userPromise = createUser()
    const timestamp = Date.now()
    createItem(userPromise, { listing: 'public' })
    .delay(debounceDelay)
    .then(() => getRefreshedUser(userPromise))
    .then(user => {
      user.snapshot.public['items:count'].should.equal(1)
      user.snapshot.public['items:last-add'].should.be.greaterThan(timestamp)
      user.snapshot.network['items:count'].should.equal(0)
      user.snapshot.private['items:count'].should.equal(0)
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should deduce the title from an edition entity', done => {
    const title = 'Un mariage à Lyon'
    ensureEditionExists('isbn:9782253138938', null, {
      labels: {},
      claims: {
        'wdt:P31': [ 'wd:Q3331189' ],
        'wdt:P212': [ '978-2-253-13893-8' ],
        'wdt:P1476': [ title ]
      }
    })
    .then(() => authReq('post', '/api/items', { entity: 'isbn:9782253138938' })
    .then(item => {
      item.snapshot.should.be.an.Object()
      item.snapshot['entity:title'].should.equal(title)
      done()
    })).catch(undesiredErr(done))
  })

  it('should deduce the author from a work entity', done => {
    createHuman()
    .then(author => createWorkWithAuthor(author)
    .then(workEntity => authReq('post', '/api/items', { entity: workEntity.uri, lang: 'en' })
    .then(item => {
      item.snapshot.should.be.an.Object()
      item.snapshot['entity:authors'].should.equal(author.labels.en)
      done()
    }))).catch(undesiredErr(done))
  })

  it('should deduce the author from an edition entity', done => {
    ensureEditionExists('isbn:9780812993257', null, {
      labels: {},
      claims: {
        'wdt:P31': [ 'wd:Q3331189' ],
        'wdt:P212': [ '978-0-8129-9325-7' ],
        'wdt:P1476': [ 'The Road to Character' ]
      }
    })
    .then(edition => Promise.all([
      getEntitiesByUris(edition.uri, 'wdt:P629|wdt:P50').get('entities'),
      authReq('post', '/api/items', { entity: 'isbn:9780812993257' })
    ])
    .spread((entities, item) => {
      edition = entities[edition.uri]
      const work = entities[edition.claims['wdt:P629'][0]]
      const author = entities[work.claims['wdt:P50'][0]]
      const authorLabel = _.values(author.labels)[0]
      item.snapshot.should.be.an.Object()
      item.snapshot['entity:authors'].should.equal(authorLabel)
      done()
    })).catch(undesiredErr(done))
  })

  it('should reject an item created with an unknown entity', done => {
    authReq('post', '/api/items', { entity: 'isbn:9782290711217', lang: 'fr' })
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('entity not found')
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should reject an item created with a non-whitelisted entity type', done => {
    authReq('post', '/api/items', { entity: 'wd:Q1', lang: 'fr' })
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('invalid entity type')
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should use the original language label for an item created from a work without specifying in which lang the title is', done => {
    authReq('post', '/api/items', { entity: 'wd:Q3548806' })
    .then(item => {
      item.snapshot.should.be.an.Object()
      item.snapshot['entity:title'].should.equal('Die Hochzeit von Lyon')
      item.snapshot['entity:lang'].should.equal('de')
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should reject an item created with an invalid URI', done => {
    authReq('post', '/api/items', { entity: 'isbn:9782800051922' })
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('invalid uri id: 9782800051922 (uri: isbn:9782800051922)')
      done()
    })
    .catch(undesiredErr(done))
  })

  // Should not create edition conflicts on the user document
  it('should keep the snapshot data updated even when created in bulk', done => {
    const userPromise = createUser()
    Promise.all([
      createItem(userPromise, { listing: 'public' }),
      createItem(userPromise, { listing: 'network' }),
      createItem(userPromise, { listing: 'private' })
    ])
    .delay(debounceDelay)
    .then(() => getRefreshedUser(userPromise))
    .then(user => {
      user.snapshot.public['items:count'].should.equal(1)
      user.snapshot.network['items:count'].should.equal(1)
      user.snapshot.private['items:count'].should.equal(1)
      done()
    })
    .catch(undesiredErr(done))
  })
})
