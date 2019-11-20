
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath

require('should')
const validateObject = __.require('lib', 'validate_object')

describe('validate object', () => {
  it('should throw when passed an object with an invalid key', done => {
    const validKeys = [ 'b' ];
    ((() => validateObject({ a: 1 }, validKeys))).should.throw()
    done()
  })

  it('should not throw when passed an object with a valid key', done => {
    const validKeys = [ 'b' ];
    ((() => validateObject({ b: 1 }, validKeys))).should.not.throw()
    done()
  })

  it('should throw when passed an object with an invalid value', done => {
    const validKeys = [ 'b' ];
    ((() => validateObject({ b: 1 }, validKeys, 'string'))).should.throw()
    done()
  })

  it('should not throw when passed an object with a valid value', done => {
    const validKeys = [ 'b' ];
    ((() => validateObject({ b: 1 }, validKeys, 'number'))).should.not.throw()
    done()
  })
})
