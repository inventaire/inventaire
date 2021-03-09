require('should')
const sanitize = require('lib/sanitize/sanitize')
const { undesiredRes, shouldNotBeCalled } = require('../utils')

describe('sanitize', () => {
  it('should be a function', () => {
    sanitize.should.be.a.Function()
  })

  it('should return a promise', done => {
    // eslint-disable-next-line handle-callback-err
    sanitize().catch(err => done())
  })

  it('should reject invalid req objects based on req.query existance', done => {
    const req = {}
    const configs = {}
    sanitize(req, {}, configs)
    .catch(err => {
      err.message.should.startWith('TypeError: expected object, got undefined')
      done()
    })
    .catch(done)
  })

  it('should add a warning for unknown parameter (server error)', async () => {
    const req = { query: { foo: 1000 } }
    const res = {}
    const configs = {
      foo: {}
    }
    const input = await sanitize(req, res, configs)
    input.should.deepEqual({})
    res.warnings.should.be.an.Object()
    res.warnings.parameters.should.deepEqual([
      'unexpected config parameter: foo'
    ])
  })

  it('should add a warning for unexpected parameter (user error)', async () => {
    const req = { query: { limit: 1000 } }
    const res = {}
    const configs = {}
    const input = await sanitize(req, res, configs)
    input.should.deepEqual({})
    res.warnings.should.be.an.Object()
    res.warnings.parameters.should.deepEqual([
      'unexpected parameter: limit'
    ])
  })

  it('should by default look for parameters in the body in POST and PUT requests', async () => {
    const req = { method: 'POST', body: { lang: 'es' }, query: {} }
    const res = {}
    const configs = { lang: {} }
    const { lang } = await sanitize(req, res, configs)
    lang.should.equal('es')
  })

  it('may optionally look for parameters in the query in POST and PUT requests', async () => {
    const req = { method: 'POST', query: { lang: 'es' } }
    const res = {}
    const configs = { lang: {}, nonJsonBody: true }
    const { lang } = await sanitize(req, res, configs)
    lang.should.equal('es')
  })

  describe('optional parameters', () => {
    it('should accept optional parameters', async () => {
      const req = { query: {} }
      const res = {}
      const configs = { ids: { optional: true } }
      const input = await sanitize(req, res, configs)
      Object.keys(input).length.should.equal(0)
    })

    it('should still validate optional parameters', done => {
      const req = { query: { lang: '1212515' } }
      const res = {}
      const configs = { lang: { optional: true } }
      sanitize(req, res, configs)
      .then(undesiredRes(done))
      .catch(err => {
        err.message.should.equal('invalid lang: 1212515')
        done()
      })
      .catch(done)
    })
  })

  describe('secret parameter', () => {
    it('should not return the value', done => {
      const req = { query: { password: 'a' } }
      const configs = { password: {} }
      sanitize(req, {}, configs)
      .then(undesiredRes(done))
      .catch(err => {
        err.context.value.should.equal('*')
        done()
      })
      .catch(done)
    })
  })

  describe('generic parameter', () => {
    it('should accept generic parameters', async () => {
      const req = { query: { 'include-users': true } }
      const res = {}

      const configs = {
        'include-users': {
          generic: 'boolean',
          default: false
        }
      }

      const { includeUsers } = await sanitize(req, res, configs)
      includeUsers.should.be.true()
    })

    it('should throw when passed an invalid generic name', done => {
      const req = { query: {} }
      const res = {}

      const configs = {
        foo: {
          generic: 'bar'
        }
      }

      sanitize(req, res, configs)
      .then(undesiredRes(done))
      .catch(err => {
        err.message.should.equal('invalid generic name')
        done()
      })
      .catch(done)
    })

    it('should clone default values', async () => {
      const req = { query: {} }
      const res = {}
      const obj = {}
      const configs = {
        foo: {
          generic: 'object',
          default: obj
        }
      }

      const { foo } = await sanitize(req, res, configs)
      foo.should.deepEqual({})
      foo.should.not.equal(obj)
    })
  })

  describe('strictly positive integer', () => {
    it('should accept string values', done => {
      const req = { query: { limit: '5' } }
      const configs = { limit: {} }
      sanitize(req, {}, configs)
      .then(input => {
        input.limit.should.equal(5)
        done()
      })
      .catch(done)
    })

    it('should accept a default value', async () => {
      const req = { query: {} }
      const configs = { limit: { default: 100 } }
      const { limit } = await sanitize(req, {}, configs)
      limit.should.equal(100)
    })

    it('should accept a max value', async () => {
      const req = { query: { limit: 1000 } }
      const res = {}
      const configs = { limit: { max: 500 } }
      const { limit } = await sanitize(req, res, configs)
      limit.should.equal(500)
      res.warnings.should.be.an.Object()
      res.warnings.parameters.should.deepEqual([
        "limit can't be over 500"
      ])
    })

    it('should reject negative values', done => {
      const req = { query: { limit: '-5' } }
      const configs = { limit: {} }
      sanitize(req, {}, configs)
      .then(undesiredRes(done))
      .catch(err => {
        err.message.should.equal('invalid limit: -5')
        done()
      })
      .catch(done)
    })

    it('should reject non-integer values', done => {
      const req = { query: { limit: '5.5' } }
      const configs = { limit: {} }
      sanitize(req, {}, configs)
      .then(undesiredRes(done))
      .catch(err => {
        err.message.should.equal('invalid limit: 5.5')
        done()
      })
      .catch(done)
    })

    it('should reject non-number values', done => {
      const req = { query: { limit: 'bla' } }
      const configs = { limit: {} }
      sanitize(req, {}, configs)
      .then(undesiredRes(done))
      .catch(err => {
        err.message.should.equal('invalid limit: bla')
        done()
      })
      .catch(done)
    })
  })

  describe('couch uuid', () => {
    it('should reject invalid uuids values', done => {
      const req = { query: { user: 'foo' } }
      const configs = { user: {} }
      sanitize(req, {}, configs)
      .then(undesiredRes(done))
      .catch(err => {
        err.message.should.equal('invalid user: foo')
        done()
      })
      .catch(done)
    })

    it('should accept valid uuids', async () => {
      const req = { query: { user: '00000000000000000000000000000000' } }
      const configs = { user: {} }
      const { user, userId } = await sanitize(req, {}, configs)
      user.should.equal('00000000000000000000000000000000')
      userId.should.equal('00000000000000000000000000000000')
    })
  })

  describe('string with specific length', () => {
    it('should reject a token of invalid type', done => {
      const req = { query: { token: 1251251 } }
      const configs = { token: { length: 32 } }
      sanitize(req, {}, configs)
      .then(undesiredRes(done))
      .catch(err => {
        err.message.should.equal('invalid token: expected string, got number')
        done()
      })
      .catch(done)
    })

    it('should reject an invalid token', done => {
      const req = { query: { token: 'foo' } }
      const configs = { token: { length: 32 } }
      sanitize(req, {}, configs)
      .then(undesiredRes(done))
      .catch(err => {
        err.message.should.equal('invalid token length: expected 32, got 3')
        done()
      })
      .catch(done)
    })
  })

  describe('objects', () => {
    it('should stringify invalid values', done => {
      const req = { query: { foo: [ 123 ] } }
      const configs = { foo: { generic: 'object' } }

      sanitize(req, {}, configs)
      .then(undesiredRes(done))
      .catch(err => {
        err.message.should.equal('invalid foo: [123]')
        done()
      })
      .catch(done)
    })
  })

  describe('uris', () => {
    it('should reject invalid type', done => {
      const req = { query: { uris: 1251251 } }
      const configs = { uris: {} }
      sanitize(req, {}, configs)
      .then(undesiredRes(done))
      .catch(err => {
        err.message.should.equal('invalid uris: expected array, got number')
        done()
      })
      .catch(done)
    })

    it('should reject array including invalid values', done => {
      const req = { query: { uris: [ 1251251 ] } }
      const configs = { uris: {} }
      sanitize(req, {}, configs)
      .then(undesiredRes(done))
      .catch(err => {
        err.message.should.startWith('invalid uri: expected uri, got')
        done()
      })
      .catch(done)
    })

    it('should accept uris as an array of strings', async () => {
      const req = { query: { uris: [ 'wd:Q535', 'isbn:9782330056315' ] } }
      const configs = { uris: {} }
      const { uris } = await sanitize(req, {}, configs)
      uris.should.deepEqual(req.query.uris)
    })

    it('should accept uris as a pipe separated string', async () => {
      const req = { query: { uris: 'wd:Q535|isbn:9782330056315' } }
      const configs = { uris: {} }
      const { uris } = await sanitize(req, {}, configs)
      uris.should.deepEqual(req.query.uris.split('|'))
    })
  })

  describe('uri', () => {
    it('should reject invalid type', done => {
      const req = { query: { uri: 1251251 } }
      const configs = { uri: {} }
      sanitize(req, {}, configs)
      .then(undesiredRes(done))
      .catch(err => {
        err.message.should.startWith('invalid uri')
        done()
      })
      .catch(done)
    })
  })

  describe('ids', () => {
    it('should reject invalid type', done => {
      const req = { query: { ids: 1251251 } }
      const configs = { ids: {} }
      sanitize(req, {}, configs)
      .then(undesiredRes(done))
      .catch(err => {
        err.message.should.equal('invalid ids: expected array, got number')
        done()
      })
      .catch(done)
    })

    it('should reject array including invalid values', done => {
      const req = { query: { ids: [ 1251251 ] } }
      const configs = { ids: {} }
      sanitize(req, {}, configs)
      .then(undesiredRes(done))
      .catch(err => {
        err.message.should.startWith('invalid id: expected id, got')
        done()
      })
      .catch(done)
    })

    it('should deduplicate ids', async () => {
      const id = '5ac0fc497813d9817047e0b89301e502'
      const req = { query: { ids: [ id, id ] } }
      const configs = { ids: {} }
      const { ids } = await sanitize(req, {}, configs)
      ids.should.deepEqual([ id ])
    })

    it('should reject an empty array', done => {
      const req = { query: { ids: [] } }
      const configs = { ids: {} }
      sanitize(req, {}, configs)
      .then(undesiredRes(done))
      .catch(err => {
        err.message.should.startWith("ids array can't be empty")
        done()
      })
      .catch(done)
    })
  })

  describe('lang', () => {
    it("should default to 'en'", async () => {
      const req = { query: {} }
      const res = {}
      const configs = { lang: {} }
      const { lang } = await sanitize(req, res, configs)
      lang.should.equal('en')
    })

    it('should accept a valid lang', async () => {
      const req = { query: { lang: 'fr' } }
      const res = {}
      const configs = { lang: {} }
      const { lang } = await sanitize(req, res, configs)
      lang.should.equal('fr')
    })

    it('should reject an invalid lang', done => {
      const req = { query: { lang: '12512' } }
      const res = {}
      const configs = { lang: {} }
      sanitize(req, res, configs)
      .then(undesiredRes(done))
      .catch(err => {
        err.message.should.equal('invalid lang: 12512')
        done()
      })
      .catch(done)
    })
  })

  describe('relatives', () => {
    it('should reject non allowlisted relatives', done => {
      const req = { query: { relatives: [ 'bar', 'foo' ] } }
      const res = {}
      const configs = { relatives: { allowlist: [ 'bar' ] } }
      sanitize(req, res, configs)
      .catch(err => {
        err.message.should.startWith('invalid relative')
        done()
      })
      .catch(done)
    })

    it('should return relatives if allowlisted', async () => {
      const req = { query: { relatives: [ 'bar', 'foo' ] } }
      const res = {}
      const configs = { relatives: { allowlist: [ 'foo', 'bar' ] } }
      const { relatives } = await sanitize(req, res, configs)
      relatives.should.deepEqual([ 'bar', 'foo' ])
    })
  })

  describe('nonEmptyString parameters', () => {
    it('should trim value', async () => {
      const req = { query: { name: ' f oo ' } }
      const res = {}
      const configs = { name: {} }
      const { name } = await sanitize(req, res, configs)
      name.should.deepEqual('f oo')
    })

    it('should throw on empty value', async () => {
      const req = { query: {} }
      const res = {}
      const configs = { name: {} }
      await sanitize(req, res, configs)
      .then(shouldNotBeCalled)
      .catch(err => {
        err.message.should.equal('missing parameter in query: name')
      })
    })
  })

  describe('bbox', () => {
    it('should reject an incomplete bbox', async () => {
      const req = { query: { bbox: '[0, 0, 1]' } }
      const configs = { bbox: {} }
      await sanitize(req, {}, configs)
      .then(shouldNotBeCalled)
      .catch(err => {
        err.message.should.startWith('invalid bbox')
      })
    })

    it('should reject bbox with a higher minLng than maxLng', async () => {
      const req = { query: { bbox: '[0, 2, 1, 1]' } }
      const configs = { bbox: {} }
      await sanitize(req, {}, configs)
      .then(shouldNotBeCalled)
      .catch(err => {
        err.message.should.startWith('invalid bbox')
      })
    })

    it('should reject bbox with a higher minLat than maxLat', async () => {
      const req = { query: { bbox: '[2, 0, 1, 1]' } }
      const configs = { bbox: {} }
      await sanitize(req, {}, configs)
      .then(shouldNotBeCalled)
      .catch(err => {
        err.message.should.startWith('invalid bbox')
      })
    })

    it('should parse a valid bbox', async () => {
      const req = { query: { bbox: '[0, 0, 1, 1]' } }
      const configs = { bbox: {} }
      const { bbox } = await sanitize(req, {}, configs)
      bbox.should.deepEqual([ 0, 0, 1, 1 ])
    })
  })
})
