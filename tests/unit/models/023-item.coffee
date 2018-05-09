CONFIG = require('config')
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

should = require 'should'

Item = __.require 'models', 'item'

someUserId = '1234567890a1234567890b1234567890'
create = Item.create.bind null, someUserId
update = Item.update.bind null, someUserId

validItem =
  entity: 'wd:Q35160'
  listing: 'public'
  transaction: 'giving'
  pictures: ['https://pictu.re/yoplaboom']
  lang: 'fr'

extendItem = (data)->
  _.extend {}, validItem, data

describe 'item model', ->
  describe 'create', ->
    it 'should return an object', (done)->
      item = create validItem
      item.should.be.an.Object()
      done()

    it 'should throw when passed invalid attributes', (done)->
      item = extendItem { authors: 'Joanne K. Rowling' }
      (-> create(item)).should.throw()
      item2 = extendItem({ updated: Date.now() })
      (-> create(item2)).should.throw()
      done()

    describe 'id', ->
      it 'should return an object without id', (done)->
        item = create validItem
        should(item._id).not.be.ok()
        done()

    describe 'entity', ->
      it 'should return an object with a entity', (done)->
        item = create validItem
        item.entity.should.equal validItem.entity
        done()

      it 'should throw on missing entity', (done)->
        (-> create extendItem({ entity: null })).should.throw()
        done()

    describe 'pictures', ->
      it 'should return an object with a pictures array', (done)->
        item = create validItem
        item.pictures.length.should.equal validItem.pictures.length
        item.pictures[0].should.equal validItem.pictures[0]
        done()

      it 'should replace missing pictures by an empty array', (done)->
        create(extendItem({ pictures: null })).pictures.should.be.an.Array()
        create(extendItem({ pictures: null })).pictures.length.should.equal 0
        done()

    describe 'listing', ->
      it 'should return an object with a listing', (done)->
        item = create validItem
        item.listing.should.equal validItem.listing
        done()

      it 'should use a default listing value', (done)->
        item = create extendItem({ listing: null })
        item.listing.should.equal 'private'
        done()

      it 'should override a bad listing with default value', (done)->
        item = create extendItem({ listing: 'evillist' })
        item.listing.should.equal 'private'
        done()

    describe 'transaction', ->
      it 'should return an object with a transaction', (done)->
        item = create validItem
        item.transaction.should.equal validItem.transaction
        done()

      it 'should override a bad transaction with default value', (done)->
        item = create extendItem({ transaction: null })
        item.transaction.should.equal 'inventorying'
        done()

      it 'should override a bad transaction with default value', (done)->
        item = create extendItem({ transaction: 'eviltransac' })
        item.transaction.should.equal 'inventorying'
        done()

    describe 'owner', ->
      it 'should return an object with an owner', (done)->
        item = create validItem
        item.owner.should.equal someUserId
        done()

      it 'should ignore an owner passed in the data', (done)->
        item = create extendItem({ owner: 'whatever' })
        item.owner.should.equal someUserId
        done()

    describe 'created', ->
      it 'should return an object with a created time', (done)->
        item = create validItem
        _.expired(item.created, 100).should.equal false
        done()

  describe 'update', ->
    it 'should not throw when updated with a valid attribute', (done)->
      doc = create validItem
      updateAttributesData = { listing: 'private' }
      (-> update(updateAttributesData, doc)).should.not.throw()
      done()

    it 'should throw when updated with an invalid attribute', (done)->
      doc = create validItem
      updateAttributesData = { listing: 'chocolat' }
      (-> update(updateAttributesData, doc)).should.throw()
      done()
