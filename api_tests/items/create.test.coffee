CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ authReq, getUser } = __.require 'apiTests', 'utils/utils'
{ newItemBase, CountChange } = require './helpers'

describe 'items:create', ->
  it 'should create an item', (done)->
    getUser()
    .then (user)->
      userId = user._id
      authReq 'post', '/api/items', newItemBase()
      .then (item)->
        item.entity.should.equal 'wd:Q3548806'
        item.listing.should.equal 'private'
        item.transaction.should.equal 'inventorying'
        item.owner.should.equal userId
      # Delay so that the item counter update doesn't impact the following test
      .delay 10
      .then -> done()

    return

  it 'should increment the user items counter', (done)->
    getUser()
    .then (userBefore)->
      userId = userBefore._id
      authReq 'post', '/api/items', newItemBase()
      # Delay to request the user after its items count was updated
      .delay 10
      .then (res)->
        getUser()
        .then (userAfter)->
          countChange = CountChange userBefore.snapshot, userAfter.snapshot
          countChange('private').should.equal 1
          countChange('network').should.equal 0
          countChange('public').should.equal 0
          done()

    return

  it 'should deduce the title from an edition entity', (done)->
    title = 'Un mariage à Lyon'
    ensureEntityExist 'isbn:9782253138938',
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

    return

  it 'should reject an item created with a work entity without specifying in which lang the title is', (done)->
    authReq 'post', '/api/items', { entity: 'wd:Q3548806' }
    .catch (err)->
      err.statusCode.should.equal 400
      done()

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

    return

  # TODO:
  # it 'should be updated when the edition entity title change', (done)->
  # it 'should be updated when the work entity title change', (done)->

ensureEntityExist = (uri, data)->
  authReq 'get', "/api/entities?action=by-uris&uris=#{uri}"
  .get 'entities'
  .then (entities)->
    if entities[uri]? then return
    authReq 'post', '/api/entities?action=create', data
