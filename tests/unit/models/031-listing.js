import 'should'
import _ from '#builders/utils'
import { randomWords } from '#fixtures/text'
import { expired } from '#lib/time'
import Listing from '#models/listing'
import { shouldNotBeCalled } from '#tests/unit/utils'

const someUserId = '1234567890a1234567890b1234567890'
const { create, updateAttributes: update } = Listing
const fakeName = randomWords(4)
const fakeDesc = randomWords(15)

const validListing = {
  creator: someUserId,
  description: fakeDesc,
  visibility: [],
  name: fakeName,
}

const extendListing = data => Object.assign({}, validListing, data)

describe('listing model', () => {
  describe('create', () => {
    it('should return an object', () => {
      const listing = create(validListing)
      listing.should.be.an.Object()
      listing.name.should.equal(fakeName)
      listing.description.should.equal(fakeDesc)
      listing.creator.should.equal(someUserId)
      listing.visibility.should.deepEqual([])
      listing.created.should.be.a.Number()
    })

    it('should throw when passed an invalid attributes', () => {
      const listing = extendListing({ authors: 'Abel Paz' })
      const creator = () => Listing.create(listing)
      creator.should.throw()
    })

    describe('mandatory attributes', () => {
      it('should throw on missing creator', () => {
        const invalidListing = _.cloneDeep(validListing)
        delete invalidListing.creator
        const creator = () => Listing.create(invalidListing)
        creator.should.throw()
      })

      it('should throw on missing name', () => {
        const invalidListing = _.cloneDeep(validListing)
        delete invalidListing.name
        const creator = () => Listing.create(invalidListing)
        creator.should.throw()
      })
    })

    describe('visibility', () => {
      it('should use a default visibility value', () => {
        const listing = create(extendListing({ visibility: null }))
        listing.visibility.should.deepEqual([])
      })

      it('should reject a bad visibility value', () => {
        const listing = (extendListing({ visibility: [ 'notalisting' ] }))
        try {
          const res = create(listing)
          shouldNotBeCalled(res)
        } catch (err) {
          err.message.should.startWith('invalid visibility')
        }
      })
    })

    describe('creator', () => {
      it('should return an object with an creator', () => {
        const listing = create(validListing)
        listing.creator.should.equal(someUserId)
      })
    })

    describe('created', () => {
      it('should return an object with a created time', () => {
        const listing = create(validListing)
        expired(listing.created, 100).should.be.false()
      })
    })
  })

  describe('update', () => {
    it('should update when passing a valid attribute', () => {
      const listing = create(validListing)
      const updateAttributesData = { visibility: [ 'public' ] }
      const res = update(listing, updateAttributesData, someUserId)
      res.visibility.should.deepEqual([ 'public' ])
    })

    it('should throw when passing an invalid attribute', () => {
      const doc = create(validListing)
      const updateAttributesData = { foo: '123' }
      const updater = () => update(doc, updateAttributesData, someUserId)
      updater.should.throw('invalid attribute: foo')
    })

    it('should throw when passing an invalid attribute value', () => {
      const doc = create(validListing)
      const updateAttributesData = { visibility: [ 'kikken' ] }
      try {
        const res = update(doc, updateAttributesData, someUserId)
        shouldNotBeCalled(res)
      } catch (err) {
        err.message.should.startWith('invalid visibility')
      }
    })
  })
})
