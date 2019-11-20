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

const should = require('should')

const Item = __.require('models', 'item')

const someUserId = '1234567890a1234567890b1234567890'
const create = Item.create.bind(null, someUserId)
const update = Item.update.bind(null, someUserId)

const validItem = {
  entity: 'wd:Q35160',
  listing: 'public',
  transaction: 'giving',
  pictures: [ 'https://pictu.re/yoplaboom' ],
  lang: 'fr'
}

const extendItem = data => Object.assign({}, validItem, data)

describe('item model', () => {
  describe('create', () => {
    it('should return an object', done => {
      const item = create(validItem)
      item.should.be.an.Object()
      done()
    })

    it('should throw when passed invalid attributes', done => {
      const item = extendItem({ authors: 'Joanne K. Rowling' });
      ((() => create(item))).should.throw()
      const item2 = extendItem({ updated: Date.now() });
      ((() => create(item2))).should.throw()
      done()
    })

    describe('id', () => it('should return an object without id', done => {
      const item = create(validItem)
      should(item._id).not.be.ok()
      done()
    }))

    describe('entity', () => {
      it('should return an object with a entity', done => {
        const item = create(validItem)
        item.entity.should.equal(validItem.entity)
        done()
      })

      it('should throw on missing entity', done => {
        ((() => create(extendItem({ entity: null })))).should.throw()
        done()
      })
    })

    describe('listing', () => {
      it('should return an object with a listing', done => {
        const item = create(validItem)
        item.listing.should.equal(validItem.listing)
        done()
      })

      it('should use a default listing value', done => {
        const item = create(extendItem({ listing: null }))
        item.listing.should.equal('private')
        done()
      })

      it('should override a bad listing with default value', done => {
        const item = create(extendItem({ listing: 'evillist' }))
        item.listing.should.equal('private')
        done()
      })
    })

    describe('transaction', () => {
      it('should return an object with a transaction', done => {
        const item = create(validItem)
        item.transaction.should.equal(validItem.transaction)
        done()
      })

      it('should override a bad transaction with default value', done => {
        const item = create(extendItem({ transaction: null }))
        item.transaction.should.equal('inventorying')
        done()
      })

      it('should override a bad transaction with default value', done => {
        const item = create(extendItem({ transaction: 'eviltransac' }))
        item.transaction.should.equal('inventorying')
        done()
      })
    })

    describe('owner', () => {
      it('should return an object with an owner', done => {
        const item = create(validItem)
        item.owner.should.equal(someUserId)
        done()
      })

      it('should ignore an owner passed in the data', done => {
        const item = create(extendItem({ owner: 'whatever' }))
        item.owner.should.equal(someUserId)
        done()
      })
    })

    describe('created', () => it('should return an object with a created time', done => {
      const item = create(validItem)
      _.expired(item.created, 100).should.be.false()
      done()
    }))
  })

  describe('update', () => {
    it('should not throw when updated with a valid attribute', done => {
      const doc = create(validItem)
      const updateAttributesData = { listing: 'private' };
      ((() => update(updateAttributesData, doc))).should.not.throw()
      done()
    })

    it('should throw when updated with an invalid attribute', done => {
      const doc = create(validItem)
      const updateAttributesData = { foo: '123' };
      ((() => update(updateAttributesData, doc))).should.throw('invalid attribute: foo')
      done()
    })

    it('should throw when updated with an invalid attribute value', done => {
      const doc = create(validItem)
      const updateAttributesData = { listing: 'chocolat' };
      ((() => update(updateAttributesData, doc))).should.throw()
      done()
    })
  })
})
