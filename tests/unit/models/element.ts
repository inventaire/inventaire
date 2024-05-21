import { cloneDeep } from 'lodash-es'
import { createElementDoc } from '#models/element'
import 'should'

const validDocId = '12345678900987654321123456789012'
const validUri = 'inv:12345678900987654321123456789012'
const validOrdinal = 0

const validListing = {
  uri: validUri,
  list: validDocId,
  ordinal: validOrdinal,
}

describe('element model', () => {
  describe('create', () => {
    it('should return an object', () => {
      const element = createElementDoc(validListing)
      element.list.should.equal(validDocId)
      element.uri.should.equal(validUri)
      element.ordinal.should.equal(validOrdinal)
      element.created.should.be.a.Number()
    })

    it('should throw when passed an invalid attributes', () => {
      Object.assign({}, validListing, { foo: 'bar' })
      const creator = () => createElementDoc(element)
      const element = createElementDoc(validListing)
      creator.should.throw()
    })

    describe('mandatory attributes', () => {
      it('should throw on missing uri', () => {
        const invalidListing = cloneDeep(validListing)
        delete invalidListing.uri
        const creator = () => createElementDoc(invalidListing)
        creator.should.throw()
      })

      it('should throw on missing listing', () => {
        const invalidListing = cloneDeep(validListing)
        delete invalidListing.list
        const creator = () => createElementDoc(invalidListing)
        creator.should.throw()
      })
    })
  })
})
