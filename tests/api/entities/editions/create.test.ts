import 'should'
import { authReq } from '#tests/api/utils/utils'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'
import { createWork, createSerie, randomLabel, generateIsbn13h } from '../../fixtures/entities.js'

const workEntityPromise = createWork()

describe('entities:editions:create', () => {
  it('should not be able to create an edition entity without a work entity', async () => {
    await authReq('post', '/api/entities?action=create', {
      labels: {},
      claims: { 'wdt:P31': [ 'wd:Q3331189' ] },
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('an edition should have an associated work (wdt:P629)')
    })
  })

  it('should reject an edition entity without a title', async () => {
    const workEntity = await workEntityPromise
    await authReq('post', '/api/entities?action=create', {
      labels: {},
      claims: {
        'wdt:P31': [ 'wd:Q3331189' ],
        'wdt:P629': [ workEntity.uri ],
      },
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('an edition should have a title (wdt:P1476)')
    })
  })

  it('should reject an edition with a label', async () => {
    const workEntity = await workEntityPromise
    await authReq('post', '/api/entities?action=create', {
      labels: { fr: randomLabel() },
      claims: {
        'wdt:P31': [ 'wd:Q3331189' ],
        'wdt:P629': [ workEntity.uri ],
        'wdt:P1476': [ randomLabel() ],
      },
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal("editions can't have labels")
    })
  })

  it('should accept an edition without a labels object', async () => {
    const workEntity = await workEntityPromise
    await createEdition(workEntity.uri)
  })

  it('should not be able to create an edition entity with a non-work entity', async () => {
    const serieEntity = await createSerie()
    await createEdition(serieEntity.uri)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('invalid claim value: invalid claim entity type: serie')
    })
  })
})

const createEdition = uri => authReq('post', '/api/entities?action=create', {
  claims: {
    'wdt:P31': [ 'wd:Q3331189' ],
    'wdt:P629': [ uri ],
    'wdt:P1476': [ randomLabel() ],
    'wdt:P212': [ generateIsbn13h() ],
  },
})
