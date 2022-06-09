const _ = require('builders/utils')
const Selection = require('models/selection')
require('should')

const { create } = Selection

const validDocId = '12345678900987654321123456789012'
const validUri = 'inv:12345678900987654321123456789012'

const validList = {
  uri: validUri,
  list: validDocId
}

describe('selection model', () => {
  describe('create', () => {
    it('should return an object', () => {
      const selection = create(validList)
      selection.list.should.equal(validDocId)
      selection.uri.should.equal(validUri)
      selection.created.should.be.a.Number()
    })

    it('should throw when passed an invalid attributes', () => {
      Object.assign({}, validList, { foo: 'bar' })
      const creator = () => Selection.create(selection)
      const selection = create(validList)
      creator.should.throw()
    })

    describe('mandatory attributes', () => {
      it('should throw on missing uri', () => {
        const invalidList = _.cloneDeep(validList)
        delete invalidList.uri
        const creator = () => Selection.create(invalidList)
        creator.should.throw()
      })

      it('should throw on missing list', () => {
        const invalidList = _.cloneDeep(validList)
        delete invalidList.list
        const creator = () => Selection.create(invalidList)
        creator.should.throw()
      })
    })
  })
})
