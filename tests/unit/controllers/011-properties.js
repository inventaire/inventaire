const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')

const { validateValueType } = __.require('controllers', 'entities/lib/properties/validations')

describe('properties', () => {
  describe('validateValueType', () => {
    it('should return false when passed the wrong type', () => {
      validateValueType('wdt:P50', 123).should.be.false()
      validateValueType('wdt:P212', null).should.be.false()
    })

    it('should return true when passed the right type', () => {
      validateValueType('wdt:P50', 'not a qid but a proper string').should.be.true()
      validateValueType('wdt:P212', 'not an isbn but a proper string').should.be.true()
    })
  })
})
