import { assertTypes, assertType } from '#lib/utils/assert_types'
import 'should'

describe('assert_', () => {
  describe('type', () => {
    describe('string', () => {
      it('should throw on false string', () => {
        ;(() => assertType('string', 123)).should.throw()
        ;(() => assertType('string', [ 'iam an array' ])).should.throw()
        ;(() => assertType('string', { iam: 'an object' })).should.throw()
      })

      it('should not throw on true string', () => {
        ;(() => assertType('string', 'im am a string')).should.not.throw()
      })
    })

    describe('number', () => {
      it('should throw on false number', () => {
        ;(() => assertType('number', [ 'iam an array' ])).should.throw()
        ;(() => assertType('number', 'im am a string')).should.throw()
        ;(() => assertType('number', { iam: 'an object' })).should.throw()
      })

      it('should not throw on true number', () => {
        ;(() => assertType('number', 123)).should.not.throw()
      })
    })

    describe('array', () => {
      it('should throw on false array', () => {
        ;(() => assertType('array', 'im am a string')).should.throw()
        ;(() => assertType('array', 123)).should.throw()
        ;(() => assertType('array', { iam: 'an object' })).should.throw()
      })

      it('should not throw on true array', () => {
        ;(() => assertType('array', [ 'iam an array' ])).should.not.throw()
      })
    })

    describe('object', () => {
      it('should throw on false object', () => {
        ;(() => assertType('object', 'im am a string')).should.throw()
        ;(() => assertType('object', 123)).should.throw()
        ;(() => assertType('object', [ 'iam an array' ])).should.throw()
      })

      it('should not throw on true object', () => {
        ;(() => assertType('object', { iam: 'an object' })).should.not.throw()
      })
    })

    describe('promise', () => {
      it('should throw on false promise object', () => {
        ;(() => assertType('promise', 'im am a string')).should.throw()
        ;(() => assertType('promise', 123)).should.throw()
        ;(() => assertType('promise', [ 'iam an array' ])).should.throw()
        ;(() => assertType('promise', { plain: 'object' })).should.throw()
      })

      it('should not throw on promise', () => {
        ;(() => { assertType('promise', Promise.resolve()) }).should.not.throw()
      })
    })

    describe('null', () => {
      it('should throw on false null', () => {
        ;(() => assertType('null', 'im am a string')).should.throw()
      })

      it('should not throw on true null', () => {
        ;(() => assertType('null', null)).should.not.throw()
      })
    })

    describe('undefined', () => {
      it('should throw on false undefined', () => {
        ;(() => assertType('undefined', 'im am a string')).should.throw()
      })

      it('should not throw on true undefined', () => {
        ;(() => assertType('undefined', undefined)).should.not.throw()
      })
    })

    describe('general', () => {
      it('should accept piped types', () => {
        ;(() => assertType('number|null', 1252154)).should.not.throw()
        ;(() => assertType('number|null', null)).should.not.throw()
        ;(() => assertType('number|null', 'what?')).should.throw()
        ;(() => assertType('string|null', 'what?')).should.not.throw()
      })

      it('should throw when none of the piped types is true', () => {
        ;(() => assertType('number|null', 'what?')).should.throw()
        ;(() => assertType('array|string', 123)).should.throw()
      })
    })
  })

  describe('types', () => {
    it('should handle multi arguments type', () => {
      const args = [ 1, '2' ]
      const types = [ 'number', 'string' ]
      ;(() => assertTypes(types, args)).should.not.throw()
    })

    it('should throw when an argument is of the wrong type', () => {
      const args = [ 1, 2 ]
      const types = [ 'number', 'string' ]
      ;(() => assertTypes(types, args)).should.throw()
    })

    it('should throw when not enough arguments are passed', () => {
      const args = [ 1 ]
      const types = [ 'number', 'string' ]
      ;(() => assertTypes(types, args)).should.throw()
    })

    it('should throw when too many arguments are passed', () => {
      const args = [ 1, '2', 3 ]
      const types = [ 'number', 'string' ]
      ;(() => assertTypes(types, args)).should.throw()
    })

    it('accepts a common type for all the args as a string', () => {
      const types = 'numbers...'
      ;(() => assertTypes(types, [])).should.not.throw()
      ;(() => assertTypes(types, [ 1 ])).should.not.throw()
      ;(() => assertTypes(types, [ 1, 2 ])).should.not.throw()
      ;(() => assertTypes(types, [ 1, 2, 'foo' ])).should.throw()
    })

    it("should not accept other strings as types that the 's...' interface", () => {
      const types = 'numbers'
      ;(() => assertTypes(types, [ 1, 2, 3 ])).should.throw()
    })

    it("should accept piped 's...' types", () => {
      const types = 'strings...|numbers...'
      ;(() => assertTypes(types, [ 1, '2', 3 ])).should.not.throw()
    })

    it("should not accept piped 's...' types if 'arguments' is passed", () => {
      const types = 'strings...'
      ;(function () {
        // eslint-disable-next-line prefer-rest-params
        assertTypes(types, arguments)
      }).should.throw("types should be an array when used with 'arguments'")
    })
  })
})
