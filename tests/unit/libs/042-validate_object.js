const CONFIG = require('config')
const __ = CONFIG.universalPath

require('should')
const validateObject = __.require('lib', 'validate_object')

describe('validate object', () => {
  it('should throw when passed an object with an invalid key', () => {
    const validKeys = [ 'b' ];
    (() => validateObject({ a: 1 }, validKeys)).should.throw()
  })

  it('should not throw when passed an object with a valid key', () => {
    const validKeys = [ 'b' ];
    (() => validateObject({ b: 1 }, validKeys)).should.not.throw()
  })

  it('should throw when passed an object with an invalid value', () => {
    const validKeys = [ 'b' ];
    (() => validateObject({ b: 1 }, validKeys, 'string')).should.throw()
  })

  it('should not throw when passed an object with a valid value', () => {
    const validKeys = [ 'b' ];
    (() => validateObject({ b: 1 }, validKeys, 'number')).should.not.throw()
  })
})
