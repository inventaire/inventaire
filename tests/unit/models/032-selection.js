const _ = require('builders/utils')
const Selection = require('models/selection')
require('should')

const { create } = Selection

const validDocId = '12345678900987654321123456789012'
const validUri = 'inv:12345678900987654321123456789012'

const validListing = {
  uri: validUri,
  list: validDocId
}

describe('selection model', () => {
  describe('create', () => {
    it('should return an object', () => {
      const selection = create(validListing)
      selection.list.should.equal(validDocId)
      selection.uri.should.equal(validUri)
      selection.created.should.be.a.Number()
    })

    it('should throw when passed an invalid attributes', () => {
      Object.assign({}, validListing, { foo: 'bar' })
      const creator = () => Selection.create(selection)
      const selection = create(validListing)
      creator.should.throw()
    })

    describe('mandatory attributes', () => {
      it('should throw on missing uri', () => {
        const invalidListing = _.cloneDeep(validListing)
        delete invalidListing.uri
        const creator = () => Selection.create(invalidListing)
        creator.should.throw()
      })

      it('should throw on missing listing', () => {
        const invalidListing = _.cloneDeep(validListing)
        delete invalidListing.list
        const creator = () => Selection.create(invalidListing)
        creator.should.throw()
      })
    })
  })
})
