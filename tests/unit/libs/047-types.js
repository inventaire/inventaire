const CONFIG = require('config')
const __ = CONFIG.universalPath
const assert_ = require('lib/utils/assert_types')
require('should')

describe('assert_', () => {
  describe('type', () => {
    describe('string', () => {
      it('should throw on false string', () => {
        (() => assert_.type('string', 123)).should.throw();
        (() => assert_.type('string', [ 'iam an array' ])).should.throw();
        (() => assert_.type('string', { iam: 'an object' })).should.throw()
      })

      it('should not throw on true string', () => {
        (() => assert_.type('string', 'im am a string')).should.not.throw()
      })
    })

    describe('number', () => {
      it('should throw on false number', () => {
        (() => assert_.type('number', [ 'iam an array' ])).should.throw();
        (() => assert_.type('number', 'im am a string')).should.throw();
        (() => assert_.type('number', { iam: 'an object' })).should.throw()
      })

      it('should not throw on true number', () => {
        (() => assert_.type('number', 123)).should.not.throw()
      })
    })

    describe('array', () => {
      it('should throw on false array', () => {
        (() => assert_.type('array', 'im am a string')).should.throw();
        (() => assert_.type('array', 123)).should.throw();
        (() => assert_.type('array', { iam: 'an object' })).should.throw()
      })

      it('should not throw on true array', () => {
        (() => assert_.type('array', [ 'iam an array' ])).should.not.throw()
      })
    })

    describe('object', () => {
      it('should throw on false object', () => {
        (() => assert_.type('object', 'im am a string')).should.throw();
        (() => assert_.type('object', 123)).should.throw();
        (() => assert_.type('object', [ 'iam an array' ])).should.throw()
      })

      it('should not throw on true object', () => {
        (() => assert_.type('object', { iam: 'an object' })).should.not.throw()
      })
    })

    describe('promise', () => {
      it('should throw on false promise object', () => {
        (() => assert_.type('promise', 'im am a string')).should.throw();
        (() => assert_.type('promise', 123)).should.throw();
        (() => assert_.type('promise', [ 'iam an array' ])).should.throw();
        (() => assert_.type('promise', { plain: 'object' })).should.throw()
      })

      it('should not throw on promise', () => {
        (() => { assert_.type('promise', Promise.resolve()) }).should.not.throw()
      })
    })

    describe('null', () => {
      it('should throw on false null', () => {
        (() => assert_.type('null', 'im am a string')).should.throw()
      })

      it('should not throw on true null', () => {
        (() => assert_.type('null', null)).should.not.throw()
      })
    })

    describe('undefined', () => {
      it('should throw on false undefined', () => {
        (() => assert_.type('undefined', 'im am a string')).should.throw()
      })

      it('should not throw on true undefined', () => {
        (() => assert_.type('undefined', undefined)).should.not.throw()
      })
    })

    describe('general', () => {
      it('should return the passed object', () => {
        const array = [ 'im an array' ]
        assert_.type('array', array).should.equal(array)
        const obj = { im: 'an array' }
        assert_.type('object', obj).should.equal(obj)
      })

      it('should accept piped types', () => {
        (() => assert_.type('number|null', 1252154)).should.not.throw();
        (() => assert_.type('number|null', null)).should.not.throw();
        (() => assert_.type('number|null', 'what?')).should.throw();
        (() => assert_.type('string|null', 'what?')).should.not.throw()
      })

      it('should throw when none of the piped types is true', () => {
        (() => assert_.type('number|null', 'what?')).should.throw();
        (() => assert_.type('array|string', 123)).should.throw()
      })
    })
  })

  describe('types', () => {
    it('should handle multi arguments type', () => {
      const args = [ 1, '2' ]
      const types = [ 'number', 'string' ];
      (() => assert_.types(types, args)).should.not.throw()
    })

    it('should throw when an argument is of the wrong type', () => {
      const args = [ 1, 2 ]
      const types = [ 'number', 'string' ];
      (() => assert_.types(types, args)).should.throw()
    })

    it('should throw when not enough arguments are passed', () => {
      const args = [ 1 ]
      const types = [ 'number', 'string' ];
      (() => assert_.types(types, args)).should.throw()
    })

    it('should throw when too many arguments are passed', () => {
      const args = [ 1, '2', 3 ]
      const types = [ 'number', 'string' ];
      (() => assert_.types(types, args)).should.throw()
    })

    it('accepts a common type for all the args as a string', () => {
      const types = 'numbers...';
      (() => assert_.types(types, [])).should.not.throw();
      (() => assert_.types(types, [ 1 ])).should.not.throw();
      (() => assert_.types(types, [ 1, 2 ])).should.not.throw();
      (() => assert_.types(types, [ 1, 2, 'foo' ])).should.throw()
    })

    it("should not accept other strings as types that the 's...' interface", () => {
      const types = 'numbers';
      (() => assert_.types(types, [ 1, 2, 3 ])).should.throw()
    })

    it("should accept piped 's...' types", () => {
      const types = 'strings...|numbers...';
      (() => assert_.types(types, [ 1, '2', 3 ])).should.not.throw()
    })

    it("should not accept piped 's...' types if 'arguments' is passed", () => {
      const types = 'strings...';
      // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
      (function () {
        assert_.types(types, arguments)
      }).should.throw("types should be an array when used with 'arguments'")
    })
  })
})
