import should from 'should'
import { sanitize, validateSanitization } from '#lib/sanitize/sanitize'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'
import type { Req, Res } from '#types/server'

describe('sanitize', () => {
  it('should reject invalid req objects based on req.query existance', async () => {
    const req = {} as Req
    const configs = {}
    try {
      sanitize(req, {} as Res, configs)
      shouldNotBeCalled()
    } catch (err) {
      err.name.should.equal('TypeError')
      err.message.should.startWith('expected object, got undefined')
    }
  })

  it('should add a warning for unexpected parameter (user error)', async () => {
    const req = { method: 'GET', query: { limit: 1000 } } as Req
    const res = {} as Res
    const configs = {}
    const input = sanitize(req, res, configs)
    input.should.deepEqual({})
    res.warnings.should.be.an.Object()
    res.warnings.should.deepEqual([
      'unexpected parameter: limit',
    ])
  })

  it('should by default look for parameters in the body in POST and PUT requests', async () => {
    const req = { method: 'POST', body: { lang: 'es' }, query: {} } as Req
    const res = {} as Res
    const configs = { lang: {} }
    const { lang } = sanitize(req, res, configs)
    lang.should.equal('es')
  })

  it('should optionally look for parameters in the query in POST and PUT requests', async () => {
    const req = { method: 'POST', query: { lang: 'es' } } as Req
    const res = {} as Res
    const configs = { lang: {}, nonJsonBody: true }
    const { lang } = sanitize(req, res, configs)
    lang.should.equal('es')
    const { lang: lang2 } = sanitize(req, res, configs)
    lang2.should.equal('es')
  })

  it('should not remove non-parameter options from configs', async () => {
    const req = { method: 'POST', query: { lang: 'es' } } as Req
    const res = {} as Res
    const configs = { lang: {}, nonJsonBody: true }
    const { lang } = sanitize(req, res, configs)
    lang.should.equal('es')
    const { lang: lang2 } = sanitize(req, res, configs)
    lang2.should.equal('es')
  })

  it('should allow to have null values', async () => {
    const req = { method: 'POST', query: {}, body: { value: null } } as Req
    const res = {} as Res
    const configs = { value: { canBeNull: true } }
    const { value } = sanitize(req, res, configs)
    should(value).be.Null()
  })

  describe('optional parameters', () => {
    it('should accept optional parameters', async () => {
      const req = { method: 'GET', query: {} } as Req
      const res = {} as Res
      const configs = { ids: { optional: true } }
      const input = sanitize(req, res, configs)
      Object.keys(input).length.should.equal(0)
    })

    it('should still validate optional parameters', async () => {
      const req = { method: 'GET', query: { lang: '1212515' } } as Req
      const res = {} as Res
      const configs = { lang: { optional: true } }
      try {
        sanitize(req, res, configs)
        shouldNotBeCalled()
      } catch (err) {
        err.message.should.equal('invalid lang: 1212515')
      }
    })
  })

  describe('secret parameter', () => {
    it('should not return the value', async () => {
      const req = { method: 'GET', query: { password: 'a' } } as Req
      const configs = { password: {} }
      try {
        sanitize(req, {} as Res, configs)
        shouldNotBeCalled()
      } catch (err) {
        err.context.value.should.equal('*')
      }
    })
  })

  describe('generic parameter', () => {
    it('should accept boolean generic parameters', async () => {
      const req = { method: 'GET', query: { 'include-users': true } } as Req
      const res = {} as Res
      const configs = {
        'include-users': {
          generic: 'boolean',
          default: false,
        },
      } as const
      const { includeUsers } = sanitize(req, res, configs)
      includeUsers.should.be.true()
    })

    it('should accept allowlist generic parameters', async () => {
      const res = {} as Res
      const configs = {
        foo: {
          generic: 'allowlist',
          allowlist: [ 'a', 'b', 'c' ],
        },
      } as const
      // @ts-expect-error
      const { foo } = sanitize({ query: { foo: 'a' } } as Req, res, configs)
      foo.should.equal('a')
      try {
        sanitize({ query: { foo: 'd' } } as Req, res, configs)
        shouldNotBeCalled()
      } catch (err) {
        err.message.should.startWith('invalid foo')
      }
    })

    it('should reject non-string allowlist value', async () => {
      const req = { method: 'POST', query: {}, body: { attributes: 123 } } as Req
      const res = {} as Res
      const configs = {
        attributes: {
          allowlist: [ 'foo' ],
        },
      }
      try {
        sanitize(req, res, configs)
        shouldNotBeCalled()
      } catch (err) {
        err.message.should.startWith('invalid attributes')
      }
    })

    it('should reject non-string array-wrapped allowlist value', async () => {
      const req = { method: 'POST', query: {}, body: { attributes: [ 123 ] } } as Req
      const res = {} as Res
      const configs = {
        attributes: {
          allowlist: [ 'foo' ],
        },
      }
      try {
        sanitize(req, res, configs)
        shouldNotBeCalled()
      } catch (err) {
        err.message.should.startWith('invalid attributes')
      }
    })

    it('should clone default values', async () => {
      const req = { method: 'GET', query: {} } as Req
      const res = {} as Res
      const obj = {}
      const configs = {
        foo: {
          generic: 'object',
          default: obj,
        },
      } as const
      // @ts-expect-error
      const { foo } = sanitize(req, res, configs)
      foo.should.deepEqual({})
      foo.should.not.equal(obj)
    })

    it('should accept an ignored generic parameters', async () => {
      const res = {} as Res
      const configs = {
        foo: {
          generic: 'ignore',
        },
      } as const
      // @ts-expect-error
      const { foo } = sanitize({ query: { foo: 'a' } } as Req, res, configs)
      should(foo).not.be.ok()
      should(res.warnings).not.be.ok()
    })
  })

  describe('strictly positive integer', () => {
    it('should accept string values', async () => {
      const req = { method: 'GET', query: { limit: '5' } } as Req
      const configs = { limit: {} }
      const { limit } = sanitize(req, {} as Res, configs)
      limit.should.equal(5)
    })

    it('should accept a default value', async () => {
      const req = { method: 'GET', query: {} } as Req
      const configs = { limit: { default: 100 } }
      const { limit } = sanitize(req, {} as Res, configs)
      limit.should.equal(100)
    })

    it('should accept a max value', async () => {
      const req = { method: 'GET', query: { limit: 1000 } } as Req
      const res = {} as Res
      const configs = { limit: { max: 500 } }
      const { limit } = sanitize(req, res, configs)
      limit.should.equal(500)
      res.warnings.should.be.an.Object()
      res.warnings.should.deepEqual([
        "limit can't be over 500",
      ])
    })

    it('should reject negative values', async () => {
      const req = { method: 'GET', query: { limit: '-5' } } as Req
      const configs = { limit: {} }
      try {
        sanitize(req, {} as Res, configs)
        shouldNotBeCalled()
      } catch (err) {
        err.message.should.equal('invalid limit: -5')
      }
    })

    it('should reject non-integer values', async () => {
      const req = { method: 'GET', query: { limit: '5.5' } } as Req
      const configs = { limit: {} }
      try {
        sanitize(req, {} as Res, configs)
        shouldNotBeCalled()
      } catch (err) {
        err.message.should.equal('invalid limit: 5.5')
      }
    })

    it('should reject non-number values', async () => {
      const req = { method: 'GET', query: { limit: 'bla' } } as Req
      const configs = { limit: {} }
      try {
        sanitize(req, {} as Res, configs)
        shouldNotBeCalled()
      } catch (err) {
        err.message.should.equal('invalid limit: bla')
      }
    })
  })

  describe('couch uuid', () => {
    it('should reject invalid uuids values', async () => {
      const req = { method: 'GET', query: { user: 'foo' } } as Req
      const configs = { user: {} }
      try {
        sanitize(req, {} as Res, configs)
        shouldNotBeCalled()
      } catch (err) {
        err.message.should.equal('invalid user: foo')
      }
    })

    it('should accept valid uuids', async () => {
      const req = { method: 'GET', query: { user: '00000000000000000000000000000000' } } as Req
      const configs = { user: {} }
      const { user, userId } = sanitize(req, {} as Res, configs)
      user.should.equal('00000000000000000000000000000000')
      userId.should.equal('00000000000000000000000000000000')
    })
  })

  describe('string with specific length', () => {
    it('should reject a token of invalid type', async () => {
      const req = { method: 'GET', query: { token: 1251251 } } as Req
      const configs = { token: { length: 32 } }
      try {
        sanitize(req, {} as Res, configs)
        shouldNotBeCalled()
      } catch (err) {
        err.message.should.equal('invalid token: expected string, got number')
      }
    })

    it('should reject an invalid token', async () => {
      const req = { method: 'GET', query: { token: 'foo' } } as Req
      const configs = { token: { length: 32 } }
      try {
        sanitize(req, {} as Res, configs)
        shouldNotBeCalled()
      } catch (err) {
        err.message.should.equal('invalid token length: expected 32, got 3')
      }
    })
  })

  describe('objects', () => {
    it('should stringify invalid values', async () => {
      const req = { method: 'GET', query: { foo: [ 123 ] } } as Req
      const configs = { foo: { generic: 'object' } } as const
      try {
        sanitize(req, {} as Res, configs)
        shouldNotBeCalled()
      } catch (err) {
        err.message.should.equal('invalid foo: [123]')
      }
    })
  })

  describe('uris', () => {
    it('should reject invalid type', async () => {
      const req = { method: 'GET', query: { uris: 1251251 } } as Req
      const configs = { uris: {} }
      try {
        sanitize(req, {} as Res, configs)
        shouldNotBeCalled()
      } catch (err) {
        err.message.should.equal('invalid uris: expected array, got number')
      }
    })

    it('should reject array including invalid values', async () => {
      const req = { method: 'GET', query: { uris: [ 1251251 ] } } as Req
      const configs = { uris: {} }
      try {
        sanitize(req, {} as Res, configs)
        shouldNotBeCalled()
      } catch (err) {
        err.message.should.startWith('invalid uri: expected uri, got')
      }
    })

    it('should accept uris as an array of strings', async () => {
      const req = { method: 'GET', query: { uris: [ 'wd:Q535', 'isbn:9782330056315' ] } } as Req
      const configs = { uris: {} }
      const { uris } = sanitize(req, {} as Res, configs)
      uris.should.deepEqual(req.query.uris)
    })

    it('should accept uris as a pipe separated string', async () => {
      const req = { method: 'GET', query: { uris: 'wd:Q535|isbn:9782330056315' } } as Req
      const configs = { uris: {} }
      const { uris } = sanitize(req, {} as Res, configs)
      uris.should.deepEqual(req.query.uris.split('|'))
    })
  })

  describe('uri', () => {
    it('should reject invalid type', async () => {
      const req = { method: 'GET', query: { uri: 1251251 } } as Req
      const configs = { uri: {} }
      try {
        sanitize(req, {} as Res, configs)
        shouldNotBeCalled()
      } catch (err) {
        err.message.should.startWith('invalid uri')
      }
    })
  })

  describe('ids', () => {
    it('should reject invalid type', async () => {
      const req = { method: 'GET', query: { ids: 1251251 } } as Req
      const configs = { ids: {} }
      try {
        sanitize(req, {} as Res, configs)
        shouldNotBeCalled()
      } catch (err) {
        err.message.should.equal('invalid ids: expected array, got number')
      }
    })

    it('should reject array including invalid values', async () => {
      const req = { method: 'GET', query: { ids: [ 1251251 ] } } as Req
      const configs = { ids: {} }
      try {
        sanitize(req, {} as Res, configs)
        shouldNotBeCalled()
      } catch (err) {
        err.message.should.startWith('invalid id: expected id, got')
      }
    })

    it('should deduplicate ids', async () => {
      const id = '5ac0fc497813d9817047e0b89301e502'
      const req = { method: 'GET', query: { ids: [ id, id ] } } as Req
      const configs = { ids: {} }
      const { ids } = sanitize(req, {} as Res, configs)
      ids.should.deepEqual([ id ])
    })

    it('should reject an empty array', async () => {
      const req = { method: 'GET', query: { ids: [] } } as Req
      const configs = { ids: {} }
      try {
        sanitize(req, {} as Res, configs)
        shouldNotBeCalled()
      } catch (err) {
        err.message.should.startWith("ids array can't be empty")
      }
    })
  })

  describe('lang', () => {
    it("should default to 'en'", async () => {
      const req = { method: 'GET', query: {} } as Req
      const res = {} as Res
      const configs = { lang: {} }
      const { lang } = sanitize(req, res, configs)
      lang.should.equal('en')
    })

    it('should accept a valid lang', async () => {
      const req = { method: 'GET', query: { lang: 'fr' } } as Req
      const res = {} as Res
      const configs = { lang: {} }
      const { lang } = sanitize(req, res, configs)
      lang.should.equal('fr')
    })

    it('should reject an invalid lang', async () => {
      const req = { method: 'GET', query: { lang: '12512' } } as Req
      const res = {} as Res
      const configs = { lang: {} }
      try {
        sanitize(req, res, configs)
        shouldNotBeCalled()
      } catch (err) {
        err.message.should.equal('invalid lang: 12512')
      }
    })
  })

  describe('relatives', () => {
    it('should reject non allowlisted relatives', async () => {
      const req = { method: 'GET', query: { relatives: [ 'bar', 'foo' ] } } as Req
      const res = {} as Res
      const configs = { relatives: { allowlist: [ 'bar' ] } }
      try {
        sanitize(req, res, configs)
        shouldNotBeCalled()
      } catch (err) {
        err.message.should.startWith('invalid relative')
      }
    })

    it('should return relatives if allowlisted', async () => {
      const req = { method: 'GET', query: { relatives: [ 'bar', 'foo' ] } } as Req
      const res = {} as Res
      const configs = { relatives: { allowlist: [ 'foo', 'bar' ] } }
      const { relatives } = sanitize(req, res, configs)
      relatives.should.deepEqual([ 'bar', 'foo' ])
    })
  })

  describe('nonEmptyString parameters', () => {
    it('should trim value', async () => {
      const req = { method: 'GET', query: { name: ' f oo ' } } as Req
      const res = {} as Res
      const configs = { name: {} }
      const { name } = sanitize(req, res, configs)
      name.should.deepEqual('f oo')
    })

    it('should throw on empty value', async () => {
      const req = { method: 'GET', query: {} } as Req
      const res = {} as Res
      const configs = { name: {} }
      try {
        sanitize(req, res, configs)
        shouldNotBeCalled()
      } catch (err) {
        err.message.should.equal('missing parameter in query: name')
      }
    })
  })

  describe('bbox', () => {
    it('should reject an incomplete bbox', async () => {
      const req = { method: 'GET', query: { bbox: '[0, 0, 1]' } } as Req
      const configs = { bbox: {} }
      try {
        sanitize(req, {} as Res, configs)
        shouldNotBeCalled()
      } catch (err) {
        err.message.should.startWith('invalid bbox')
      }
    })

    it('should reject bbox with a higher minLng than maxLng', async () => {
      const req = { method: 'GET', query: { bbox: '[0, 2, 1, 1]' } } as Req
      const configs = { bbox: {} }
      try {
        sanitize(req, {} as Res, configs)
        shouldNotBeCalled()
      } catch (err) {
        err.message.should.startWith('invalid bbox')
      }
    })

    it('should reject bbox with a higher minLat than maxLat', async () => {
      const req = { method: 'GET', query: { bbox: '[2, 0, 1, 1]' } } as Req
      const configs = { bbox: {} }
      try {
        sanitize(req, {} as Res, configs)
        shouldNotBeCalled()
      } catch (err) {
        err.message.should.startWith('invalid bbox')
      }
    })

    it('should parse a valid bbox', async () => {
      const req = { method: 'GET', query: { bbox: '[0, 0, 1, 1]' } } as Req
      const configs = { bbox: {} }
      const { bbox } = sanitize(req, {} as Res, configs)
      bbox.should.deepEqual([ 0, 0, 1, 1 ])
    })
  })

  describe('parameter renaming', () => {
    it('should set ids aliases', () => {
      const userId = 'f14b868c7e99c56252e592e1485c6125'
      const req = { method: 'GET', query: { user: userId } } as Req
      const configs = { user: {} }
      const params = sanitize(req, {} as Res, configs)
      params.userId.should.equal(userId)
      should(params.userAcct).not.be.ok()
    })

    it('should rename based on config', () => {
      const userAcct = 'f14b868c7e99c56252e592e1485c6125@localhost:3009'
      const req = { method: 'GET', query: { user: userAcct } } as Req
      const configs = { user: { type: 'acct' } }
      const params = sanitize(req, {} as Res, configs)
      params.userAcct.should.equal(userAcct)
      should(params.userId).not.be.ok()
    })
  })
})

describe('validateSanitization', () => {
  it('should reject an unknown parameter', async () => {
    try {
      validateSanitization({ foo: {} })
      shouldNotBeCalled()
    } catch (err) {
      err.message.should.equal('invalid parameter name')
      err.context.name.should.equal('foo')
      err.statusCode.should.equal(500)
    }
  })

  it('should reject an invalid generic name', async () => {
    try {
      // @ts-expect-error
      validateSanitization({ foo: { generic: 'bar' } })
      shouldNotBeCalled()
    } catch (err) {
      err.message.should.equal('invalid generic name')
      err.context.name.should.equal('foo')
      err.context.generic.should.equal('bar')
      err.statusCode.should.equal(500)
    }
  })

  it('should accept a known parameter', async () => {
    validateSanitization({ ids: {} })
  })

  it('should accept a valid generic name', async () => {
    validateSanitization({ foo: { generic: 'boolean' } })
  })
})
