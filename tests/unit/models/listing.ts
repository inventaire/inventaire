import 'should'
import { cloneDeep } from 'lodash-es'
import { randomWords } from '#fixtures/text'
import { expired } from '#lib/time'
import { createListingDoc, updateListingDocAttributes } from '#models/listing'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'

const someUserId = '1234567890a1234567890b1234567890'
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
  describe('createListingDoc', () => {
    it('should return an object', () => {
      const listing = createListingDoc(validListing)
      listing.should.be.an.Object()
      listing.name.should.equal(fakeName)
      listing.description.should.equal(fakeDesc)
      listing.creator.should.equal(someUserId)
      listing.visibility.should.deepEqual([])
      listing.created.should.be.a.Number()
    })

    it('should throw when passed an invalid attributes', () => {
      const listing = extendListing({ authors: 'Abel Paz' })
      const creator = () => createListingDoc(listing)
      creator.should.throw()
    })

    describe('mandatory attributes', () => {
      it('should throw on missing creator', () => {
        const invalidListing = cloneDeep(validListing)
        delete invalidListing.creator
        const creator = () => createListingDoc(invalidListing)
        creator.should.throw()
      })

      it('should throw on missing name', () => {
        const invalidListing = cloneDeep(validListing)
        delete invalidListing.name
        const creator = () => createListingDoc(invalidListing)
        creator.should.throw()
      })
    })

    describe('visibility', () => {
      it('should use a default visibility value', () => {
        const listing = createListingDoc(extendListing({ visibility: null }))
        listing.visibility.should.deepEqual([])
      })

      it('should reject a bad visibility value', () => {
        const listing = (extendListing({ visibility: [ 'notalisting' ] }))
        try {
          const res = createListingDoc(listing)
          shouldNotBeCalled(res)
        } catch (err) {
          err.message.should.startWith('invalid visibility')
        }
      })
    })

    describe('creator', () => {
      it('should return an object with an creator', () => {
        const listing = createListingDoc(validListing)
        listing.creator.should.equal(someUserId)
      })
    })

    describe('created', () => {
      it('should return an object with a created time', () => {
        const listing = createListingDoc(validListing)
        expired(listing.created, 100).should.be.false()
      })
    })
  })

  describe('updateListingDocAttributes', () => {
    it('should update when passing a valid attribute', () => {
      const listing = createListingDoc(validListing)
      const updateAttributesData = { visibility: [ 'public' ] }
      const res = updateListingDocAttributes(listing, updateAttributesData, someUserId)
      res.visibility.should.deepEqual([ 'public' ])
    })

    it('should throw when passing an invalid attribute', () => {
      const doc = createListingDoc(validListing)
      const updateAttributesData = { foo: '123' }
      const updater = () => updateListingDocAttributes(doc, updateAttributesData, someUserId)
      updater.should.throw('invalid attribute: foo')
    })

    it('should throw when passing an invalid attribute value', () => {
      const doc = createListingDoc(validListing)
      const updateAttributesData = { visibility: [ 'kikken' ] }
      try {
        const res = updateListingDocAttributes(doc, updateAttributesData, someUserId)
        shouldNotBeCalled(res)
      } catch (err) {
        err.message.should.startWith('invalid visibility')
      }
    })
  })
})
