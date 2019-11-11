// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const assert_ = __.require('utils', 'assert_types')
require('should')

describe('assert_', () => {
  describe('type', () => {
    describe('string', () => {
      it('should throw on false string', (done) => {
        ((() => assert_.type('string', 123))).should.throw();
        ((() => assert_.type('string', [ 'iam an array' ]))).should.throw();
        ((() => assert_.type('string', { iam: 'an object' }))).should.throw()
        return done()
      })

      return it('should not throw on true string', (done) => {
        ((() => assert_.type('string', 'im am a string'))).should.not.throw()
        return done()
      })
    })

    describe('number', () => {
      it('should throw on false number', (done) => {
        ((() => assert_.type('number', [ 'iam an array' ]))).should.throw();
        ((() => assert_.type('number', 'im am a string'))).should.throw();
        ((() => assert_.type('number', { iam: 'an object' }))).should.throw()
        return done()
      })

      return it('should not throw on true number', (done) => {
        ((() => assert_.type('number', 123))).should.not.throw()
        return done()
      })
    })

    describe('array', () => {
      it('should throw on false array', (done) => {
        ((() => assert_.type('array', 'im am a string'))).should.throw();
        ((() => assert_.type('array', 123))).should.throw();
        ((() => assert_.type('array', { iam: 'an object' }))).should.throw()
        return done()
      })

      return it('should not throw on true array', (done) => {
        ((() => assert_.type('array', [ 'iam an array' ]))).should.not.throw()
        return done()
      })
    })

    describe('object', () => {
      it('should throw on false object', (done) => {
        ((() => assert_.type('object', 'im am a string'))).should.throw();
        ((() => assert_.type('object', 123))).should.throw();
        ((() => assert_.type('object', [ 'iam an array' ]))).should.throw()
        return done()
      })

      return it('should not throw on true object', (done) => {
        ((() => assert_.type('object', { iam: 'an object' }))).should.not.throw()
        return done()
      })
    })

    describe('null', () => {
      it('should throw on false null', (done) => {
        ((() => assert_.type('null', 'im am a string'))).should.throw()
        return done()
      })

      return it('should not throw on true null', (done) => {
        const array = [];
        ((() => assert_.type('null', null))).should.not.throw()
        return done()
      })
    })

    describe('undefined', () => {
      it('should throw on false undefined', (done) => {
        ((() => assert_.type('undefined', 'im am a string'))).should.throw()
        return done()
      })

      return it('should not throw on true undefined', (done) => {
        const array = [];
        ((() => assert_.type('undefined', undefined))).should.not.throw()
        return done()
      })
    })

    return describe('general', () => {
      it('should return the passed object', (done) => {
        const array = [ 'im an array' ]
        assert_.type('array', array).should.equal(array)
        const obj = { 'im': 'an array' }
        assert_.type('object', obj).should.equal(obj)
        return done()
      })

      it('should accept piped types', (done) => {
        ((() => assert_.type('number|null', 1252154))).should.not.throw();
        ((() => assert_.type('number|null', null))).should.not.throw();
        ((() => assert_.type('number|null', 'what?'))).should.throw();
        ((() => assert_.type('string|null', 'what?'))).should.not.throw()
        return done()
      })

      return it('should throw when none of the piped types is true', (done) => {
        ((() => assert_.type('number|null', 'what?'))).should.throw();
        ((() => assert_.type('array|string', 123))).should.throw()
        return done()
      })
    })
  })

  return describe('types', () => {
    it('should handle multi arguments type', (done) => {
      const args = [ 1, '2' ]
      const types = [ 'number', 'string' ];
      ((() => assert_.types(types, args))).should.not.throw()
      return done()
    })

    it('should throw when an argument is of the wrong type', (done) => {
      const args = [ 1, 2 ]
      const types = [ 'number', 'string' ];
      ((() => assert_.types(types, args))).should.throw()
      return done()
    })

    it('should throw when not enough arguments are passed', (done) => {
      const args = [ 1 ]
      const types = [ 'number', 'string' ];
      ((() => assert_.types(types, args))).should.throw()
      return done()
    })

    it('should throw when too many arguments are passed', (done) => {
      const args = [ 1, '2', 3 ]
      const types = [ 'number', 'string' ];
      ((() => assert_.types(types, args))).should.throw()
      return done()
    })

    it('accepts a common type for all the args as a string', (done) => {
      const types = 'numbers...';
      ((() => assert_.types(types, []))).should.not.throw();
      ((() => assert_.types(types, [ 1 ]))).should.not.throw();
      ((() => assert_.types(types, [ 1, 2 ]))).should.not.throw();
      ((() => assert_.types(types, [ 1, 2, 'foo' ]))).should.throw()
      return done()
    })

    it("should not accept other strings as types that the 's...' interface", (done) => {
      const types = 'numbers';
      ((() => assert_.types(types, [ 1, 2, 3 ]))).should.throw()
      return done()
    })

    it("should accept piped 's...' types", (done) => {
      const types = 'strings...|numbers...';
      ((() => assert_.types(types, [ 1, '2', 3 ] ))).should.not.throw()
      return done()
    })

    return it("should not accept piped 's...' types if 'arguments' is passed", (done) => {
      const types = 'strings...';
      (function() { return assert_.types(types, arguments) }).should.throw()
      return done()
    })
  })
})
