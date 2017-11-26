CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ authReq, getUser, undesiredErr } = require '../utils/utils'
{ CountChange } = require './helpers'
{ ensureEditionExists, createEdition, createWorkWithAuthor, createHuman } = require '../fixtures/entities'
{ createItem } = require '../fixtures/items'
{ createUser, getRefreshedUser } = require '../fixtures/users'
debounceDelay = CONFIG.itemsCountDebounceTime + 100

editionUriPromise = createEdition().get 'uri'

describe 'items:create', ->
  it 'should create an item', (done)->
    Promise.all [
      getUser()
      editionUriPromise
    ]
    .spread (user, editionUri)->
      userId = user._id
      authReq 'post', '/api/items', { entity: editionUri }
      .then (item)->
        item.entity.should.equal editionUri
        item.listing.should.equal 'private'
        item.transaction.should.equal 'inventorying'
        item.owner.should.equal userId
      # Delay so that the item counter update doesn't impact the following test
      .delay 10
      .then -> done()
    .catch undesiredErr(done)

    return

  it 'should create items in bulk', (done)->
    Promise.all [
      getUser()
      editionUriPromise
    ]
    .spread (user, editionUri)->
      userId = user._id
      authReq 'post', '/api/items', [
        { entity: editionUri, listing: 'network', transaction: 'giving' }
        { entity: editionUri, listing: 'public', transaction: 'lending' }
      ]
      .then (items)->
        items[0].entity.should.equal editionUri
        items[0].listing.should.equal 'network'
        items[0].transaction.should.equal 'giving'
        items[0].owner.should.equal userId
        items[1].entity.should.equal editionUri
        items[1].listing.should.equal 'public'
        items[1].transaction.should.equal 'lending'
        items[1].owner.should.equal userId
      # Delay so that the item counter update doesn't impact the following test
      .delay 10
      .then -> done()
    .catch undesiredErr(done)

    return

  it 'should increment the user items counter', (done)->
    userPromise = createUser()
    createItem userPromise, { listing: 'public' }
    .delay debounceDelay
    .then -> getRefreshedUser userPromise
    .then (user)->
      user.snapshot.public['items:count'].should.equal 1
      user.snapshot.network['items:count'].should.equal 0
      user.snapshot.private['items:count'].should.equal 0
      done()
    .catch undesiredErr(done)

    return

  it 'should deduce the title from an edition entity', (done)->
    title = 'Un mariage à Lyon'
    ensureEditionExists 'isbn:9782253138938', null,
      labels: {}
      claims:
        'wdt:P31': [ 'wd:Q3331189' ]
        'wdt:P212': [ '978-2-253-13893-8' ]
        'wdt:P1476': [ title ]
    .then ->
      authReq 'post', '/api/items', { entity: 'isbn:9782253138938' }
      .then (item)->
        item.snapshot.should.be.an.Object()
        item.snapshot['entity:title'].should.equal title
        done()
    .catch undesiredErr(done)

    return

  it 'should deduce the author from a work entity', (done)->
    createHuman()
    .then (author)->
      createWorkWithAuthor author
      .then (workEntity)->
        authReq 'post', '/api/items', { entity: workEntity.uri, lang: 'en' }
        .then (item)->
          item.snapshot.should.be.an.Object()
          item.snapshot['entity:authors'].should.equal author.labels.en
          done()
    .catch undesiredErr(done)

    return

  it 'should deduce the author from an edition entity', (done)->
    authReq 'post', '/api/entities?action=create',
      labels: { de: 'Mr moin moin' }
      claims: { 'wdt:P31': [ 'wd:Q5' ] }
    .then (authorEntity)->
      workData =
        labels: { de: 'moin moin' }
        claims:
          'wdt:P31': [ 'wd:Q571' ]
          'wdt:P50': [ authorEntity.uri ]

      ensureEditionExists 'isbn:9780812993257', workData,
        labels: {}
        claims:
          'wdt:P31': [ 'wd:Q3331189' ]
          'wdt:P212': [ '978-0-8129-9325-7' ]
          'wdt:P1476': [ 'The Road to Character' ]
    .then ->
      authReq 'post', '/api/items', { entity: 'isbn:9780812993257' }
      .then (item)->
        item.snapshot.should.be.an.Object()
        item.snapshot['entity:authors'].should.equal 'Mr moin moin'
        done()
    .catch undesiredErr(done)

    return

  it 'should reject an item created with a non-whitelisted entity type', (done)->
    authReq 'post', '/api/items', { entity: 'wd:Q1', lang: 'fr' }
    .catch (err)->
      err.statusCode.should.equal 400
      err.body.status_verbose.should.equal 'invalid entity type'
      done()
    .catch undesiredErr(done)

    return

  it 'should reject an item created with a work entity without specifying in which lang the title is', (done)->
    authReq 'post', '/api/items', { entity: 'wd:Q3548806' }
    .catch (err)->
      err.statusCode.should.equal 400
      done()
    .catch undesiredErr(done)

    return

  it 'should deduce the title from a work entity and a lang', (done)->
    uri = 'wd:Q3548806'
    lang = 'fr'
    authReq 'get', "/api/entities?action=by-uris&uris=#{uri}"
    .get 'entities'
    .then (entities)->
      title = entities[uri].labels[lang]
      authReq 'post', '/api/items', { entity: 'wd:Q3548806', lang: 'fr' }
      .then (item)->
        item.snapshot.should.be.an.Object()
        item.snapshot['entity:title'].should.equal title
        done()
    .catch undesiredErr(done)

    return

  it 'should reject an item created with an invalid URI', (done)->
    authReq 'post', '/api/items', { entity: 'isbn:9782800051922' }
    .catch (err)->
      err.statusCode.should.equal 400
      err.body.status_verbose.should.equal 'invalid uri id: 9782800051922 (uri: isbn:9782800051922)'
      done()
    .catch undesiredErr(done)

    return

  # Should not create edition conflicts on the user document
  it 'should keep the snapshot data updated even when created in bulk', (done)->
    userPromise = createUser()
    Promise.all [
      createItem userPromise, { listing: 'public' }
      createItem userPromise, { listing: 'network' }
      createItem userPromise, { listing: 'private' }
    ]
    .delay debounceDelay
    .then -> getRefreshedUser userPromise
    .then (user)->
      user.snapshot.public['items:count'].should.equal 1
      user.snapshot.network['items:count'].should.equal 1
      user.snapshot.private['items:count'].should.equal 1
      done()
    .catch undesiredErr(done)

    return
